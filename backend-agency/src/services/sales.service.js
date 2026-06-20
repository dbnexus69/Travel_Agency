const prisma = require('../config/db');
const PRODUCT_HANDLERS = require('../utils/productHandlers');
const {
  findOrCreatePersona,
  resolvePaymentMethodId,
  resolveSupplierId,
  resolveAirportId
} = require('../utils/salesHelpers');

/**
 * Creates a new sale with its detailed products and payments in a single transaction.
 * @param {Object} data - The sale data from req.body
 * @param {number} userId - The authenticated user ID (req.user.id)
 * @returns {Promise<number>} The created sale ID
 */
async function createSale(data, userId) {
  return await prisma.$transaction(async (tx) => {
    const memCache = {
      suppliers: new Map(),
      paymentMethods: new Map(),
      airports: new Map(),
      airlines: new Map()
    };

    const cliente = await tx.clientes.findUnique({
      where: { id: data.clientId },
      select: { personaId: true }
    });
    if (!cliente) {
      const err = new Error('El cliente seleccionado no existe o fue eliminado');
      err.statusCode = 400;
      err.code = 'CLIENT_NOT_FOUND';
      throw err;
    }
    const personaId = cliente.personaId;

    if (data.commissionAgentId) {
      const comisionista = await tx.comisionistas.findUnique({
        where: { id: data.commissionAgentId }
      });
      if (!comisionista) {
        const err = new Error('El comisionista seleccionado no existe o fue eliminado');
        err.statusCode = 400;
        err.code = 'COMMISSION_AGENT_NOT_FOUND';
        throw err;
      }
    }

    const detalleVentasData = [];

    for (const [field, handler] of Object.entries(PRODUCT_HANDLERS)) {
      const items = Array.isArray(data[field]) ? data[field] : [];
      for (const item of items) {
        if (!item || Object.keys(item).length === 0) continue;

        const [resolvedSupplierId, resolvedSupplierPaymentMethodId] = await Promise.all([
          resolveSupplierId(tx, item.supplier, memCache),
          resolvePaymentMethodId(tx, item.supplierPaymentMethod, memCache)
        ]);

        const productData = await handler.transform(item, undefined, tx);
        delete productData.detalleVentaId; // Omit foreign key for nested create

        const pasajerosDetalleData = [];
        if (personaId) {
          const hasPassengerInfo = item.passengers || item.passengerInfo || item.guests || item.passengerName || item.ownerName ||
            ['checkin', 'documentacion_migratoria', 'simcard', 'tours', 'servicio_mascotas', 'renta_vehiculos'].includes(handler.category);
          
          if (hasPassengerInfo) {
            const passengers = item.passengers ? item.passengers : (item.passengerInfo ? [item.passengerInfo] : (item.guests || [{}]));
            for (const p of passengers) {
              const pid = await findOrCreatePersona(
                tx,
                p.name || p.passengerName || p.fullName || item.passengerName || item.ownerName || item.mainDriver,
                p.docType || item.docType,
                p.docNumber || item.docNumber || item.licenseNumber || item.passportNumber || item.idNumber,
                personaId
              );
              pasajerosDetalleData.push({
                personaId: pid,
                esTitular: p.esTitular ?? true,
                asiento: p.asiento || item.seatNumber || item.seat || null,
                nroReserva: p.nroReserva || item.reservationNumber || null,
                nroTiquete: p.nroTiquete || item.ticketNumber || null
              });
            }
          }
        }

        const detalleObj = {
          categoria: handler.category,
          nombreServicio: handler.nombreServicio,
          subtotal: (item.supplierCost || 0) + (item.ta || 0),
          costoProveedor: item.supplierCost || 0,
          ta: item.ta || 0,
          proveedorId: resolvedSupplierId,
          metodoPagoProveedorId: resolvedSupplierPaymentMethodId,
          origen: item.legs?.[0]?.origin || item.pickupLocation || null,
          destino: item.destination || item.destinationCountry || item.legs?.[0]?.destination || null,
          fechaInicioViaje: item.startDate ? new Date(item.startDate) : item.departureDate ? new Date(item.departureDate) : item.pickupDate ? new Date(item.pickupDate) : null,
          fechaFinViaje: item.endDate ? new Date(item.endDate) : item.arrivalDate ? new Date(item.arrivalDate) : item.returnDate ? new Date(item.returnDate) : null,
          observaciones: item.observations || null,
          [handler.table]: {
            create: productData
          }
        };

        if (pasajerosDetalleData.length > 0) {
          detalleObj.pasajerosDetalle = {
            create: pasajerosDetalleData
          };
        }

        if (handler.table === 'prodTiqueteria' && item.legs && item.legs.length > 0) {
          const tramosVueloData = [];
          for (let i = 0; i < item.legs.length; i++) {
            const leg = item.legs[i];
            if (!leg.origin && !leg.destination) continue;
            const [originAirportId, destAirportId] = await Promise.all([
              leg.origin ? resolveAirportId(tx, leg.origin, memCache) : null,
              leg.destination ? resolveAirportId(tx, leg.destination, memCache) : null
            ]);
            if (originAirportId && destAirportId) {
              tramosVueloData.push({
                aeropuertoOrigenId: originAirportId,
                aeropuertoDestinoId: destAirportId,
                salida: leg.date ? new Date(leg.date) : new Date(),
                llegada: leg.arrivalDate ? new Date(leg.arrivalDate) : (leg.date ? new Date(leg.date) : new Date()),
                nroVueloTramo: leg.flightNumber || null,
                asiento: leg.seat || null,
                nroTiquete: leg.ticketNumber || null,
                orden: i + 1
              });
            }
          }
          if (item.hasStops && item.outboundStops && item.outboundStops.length > 0) {
            for (const stop of item.outboundStops) {
              if (!stop.origin && !stop.destination) continue;
              const [sOriginId, sDestId] = await Promise.all([
                stop.origin ? resolveAirportId(tx, stop.origin, memCache) : null,
                stop.destination ? resolveAirportId(tx, stop.destination, memCache) : null
              ]);
              if (sOriginId && sDestId) {
                tramosVueloData.push({
                  aeropuertoOrigenId: sOriginId,
                  aeropuertoDestinoId: sDestId,
                  salida: stop.date ? new Date(stop.date) : new Date(),
                  llegada: stop.arrivalDate ? new Date(stop.arrivalDate) : (stop.date ? new Date(stop.date) : new Date()),
                  nroVueloTramo: stop.flightNumber || null,
                  asiento: stop.seat || null,
                  nroTiquete: stop.ticketNumber || null,
                  orden: tramosVueloData.length + 1
                });
              }
            }
          }

          if (item.returnLeg && item.returnLeg.origin && item.returnLeg.destination) {
            const rLeg = item.returnLeg;
            const [rOriginId, rDestId] = await Promise.all([
              resolveAirportId(tx, rLeg.origin, memCache),
              resolveAirportId(tx, rLeg.destination, memCache)
            ]);
            if (rOriginId && rDestId) {
              tramosVueloData.push({
                aeropuertoOrigenId: rOriginId,
                aeropuertoDestinoId: rDestId,
                salida: rLeg.date ? new Date(rLeg.date) : new Date(),
                llegada: rLeg.arrivalDate ? new Date(rLeg.arrivalDate) : (rLeg.date ? new Date(rLeg.date) : new Date()),
                nroVueloTramo: rLeg.flightNumber || null,
                asiento: rLeg.seat || null,
                nroTiquete: rLeg.ticketNumber || null,
                orden: tramosVueloData.length + 1
              });
            }
          }

          if (item.returnHasStops && item.returnStops && item.returnStops.length > 0) {
            for (const stop of item.returnStops) {
              if (!stop.origin && !stop.destination) continue;
              const [sOriginId, sDestId] = await Promise.all([
                stop.origin ? resolveAirportId(tx, stop.origin, memCache) : null,
                stop.destination ? resolveAirportId(tx, stop.destination, memCache) : null
              ]);
              if (sOriginId && sDestId) {
                tramosVueloData.push({
                  aeropuertoOrigenId: sOriginId,
                  aeropuertoDestinoId: sDestId,
                  salida: stop.date ? new Date(stop.date) : new Date(),
                  llegada: stop.arrivalDate ? new Date(stop.arrivalDate) : (stop.date ? new Date(stop.date) : new Date()),
                  nroVueloTramo: stop.flightNumber || null,
                  asiento: stop.seat || null,
                  nroTiquete: stop.ticketNumber || null,
                  orden: tramosVueloData.length + 1
                });
              }
            }
          }

          if (tramosVueloData.length > 0) {
            detalleObj.prodTiqueteria.create.tramosVuelo = {
              create: tramosVueloData
            };
          }
        }

        detalleVentasData.push(detalleObj);
      }
    }

    const metodoPagoId = await resolvePaymentMethodId(tx, data.paymentMethod, memCache);

    const ventaCreateData = {
      clienteId: data.clientId,
      usuarioId: userId,
      montoTotal: data.total || 0,
      costoProveedorTotal: data.supplierCost || 0,
      taTotal: data.ta || 0,
      comisionistaId: data.commissionAgentId || null,
      responsableId: data.responsableId || null,
      montoComisionBruto: data.commissionAgentAmount || 0,
      porcentajeRetencionComision: data.commissionAgentRetentionPercentage || 0,
      montoComisionNeto: data.commissionAgentNetPayment || 0,
      metodoPagoPrincipalId: metodoPagoId,
      status: data.status || 'credito',
      esCredito: data.isCredit || false,
      fechaVenceCredito: data.creditDueDate ? new Date(data.creditDueDate) : null,
      montoPagadoCredito: data.creditPaidAmount || 0,
      observaciones: data.observations || ''
    };

    if (data.payments && data.payments.length > 0) {
      ventaCreateData.pagosVenta = {
        create: data.payments.map(p => ({
          monto: p.amount,
          metodoPagoId: parseInt(p.method) || null,
          referencia: p.reference || null
        }))
      };
    }

    if (detalleVentasData.length > 0) {
      ventaCreateData.detalleVentas = {
        create: detalleVentasData
      };
    }

    const venta = await tx.ventas.create({
      data: ventaCreateData
    });

    return venta.id;
  }, {
    maxWait: 15000,
    timeout: 30000
  });
}

/**
 * Updates an existing sale, modifying payments, and adding or removing product services inside a transaction.
 * @param {number} id - Sale ID
 * @param {Object} data - Update data from req.body
 * @returns {Promise<void>}
 */
async function updateSale(id, data) {
  const venta = await prisma.ventas.findUnique({ where: { id } });
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const cliente = await prisma.clientes.findUnique({
    where: { id: data.clientId ?? venta.clienteId },
    select: { personaId: true }
  });
  const personaId = cliente?.personaId;

  if (data.commissionAgentId) {
    const comisionista = await prisma.comisionistas.findUnique({
      where: { id: data.commissionAgentId }
    });
    if (!comisionista) {
      const err = new Error('El comisionista seleccionado no existe o fue eliminado');
      err.statusCode = 400;
      err.code = 'COMMISSION_AGENT_NOT_FOUND';
      throw err;
    }
  }

  const updateData = {};
  if (data.total !== undefined) updateData.montoTotal = data.total;
  if (data.supplierCost !== undefined) updateData.costoProveedorTotal = data.supplierCost;
  if (data.ta !== undefined) updateData.taTotal = data.ta;
  if (data.status) updateData.status = data.status;
  if (data.observations !== undefined) updateData.observaciones = data.observations;
  if (data.isCredit !== undefined) updateData.esCredito = data.isCredit;
  if (data.creditDueDate) updateData.fechaVenceCredito = new Date(data.creditDueDate);
  if (data.paymentMethod) updateData.metodoPagoPrincipalId = await resolvePaymentMethodId(prisma, data.paymentMethod);
  if (data.commissionAgentId !== undefined) updateData.comisionistaId = data.commissionAgentId || null;
  if (data.responsableId !== undefined) updateData.responsableId = data.responsableId || null;
  if (data.commissionAgentAmount !== undefined) updateData.montoComisionBruto = data.commissionAgentAmount;
  if (data.commissionAgentRetentionPercentage !== undefined) updateData.porcentajeRetencionComision = data.commissionAgentRetentionPercentage;
  if (data.commissionAgentNetPayment !== undefined) updateData.montoComisionNeto = data.commissionAgentNetPayment;

  await prisma.$transaction(async (tx) => {
    await tx.ventas.update({ where: { id }, data: updateData });

    if (data.payments) {
      const existingPayments = await tx.pagosVenta.findMany({ where: { ventaId: id } });
      const existingIds = new Set(existingPayments.map(p => String(p.id)));
      const incomingIds = new Set(data.payments.map(p => String(p.id)).filter(pid => pid !== 'NaN'));

      for (const p of data.payments) {
        const pid = String(p.id);
        if (!existingIds.has(pid)) {
          await tx.pagosVenta.create({
            data: {
              ventaId: id,
              monto: p.amount,
              metodoPagoId: await resolvePaymentMethodId(tx, p.method),
              referencia: p.reference || null
            }
          });
        }
      }

      for (const existing of existingPayments) {
        if (!incomingIds.has(String(existing.id))) {
          await tx.pagosVenta.delete({ where: { id: existing.id } });
        }
      }

      const totalPaid = data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalSale = data.total || venta.montoTotal;
      const newStatus = totalPaid >= totalSale ? 'pagado' : totalPaid > 0 ? 'abonado' : 'credito';
      await tx.ventas.update({
        where: { id },
        data: { montoPagadoCredito: totalPaid, status: newStatus }
      });
    }

    const productFields = ['ticketData', 'hotelData', 'insuranceData', 'planData',
      'checkInData', 'migrationData', 'simCardData', 'carRentalData',
      'fincaData', 'tourData', 'conventionData', 'restaurantData',
      'visaData', 'passportData', 'petServiceData'];

    for (const field of productFields) {
      if (data[field] === undefined) continue;
      const handler = PRODUCT_HANDLERS[field];
      if (!handler) continue;

      const incoming = Array.isArray(data[field]) ? data[field] : [];

      const existingDetails = await tx.detalleVenta.findMany({
        where: { ventaId: id, categoria: handler.category },
        select: { id: true }
      });

      for (const item of incoming) {
        if (item.id) {
          const existing = await tx[handler.table].findUnique({ where: { id: item.id } });
          if (existing) continue;
        }
        const resolvedSupplierId = await resolveSupplierId(tx, item.supplier);
        const resolvedSupplierPaymentMethodId = await resolvePaymentMethodId(tx, item.supplierPaymentMethod);

        const detalle = await tx.detalleVenta.create({
          data: {
            ventaId: id,
            categoria: handler.category,
            nombreServicio: handler.nombreServicio,
            subtotal: (item.supplierCost || 0) + (item.ta || 0),
            costoProveedor: item.supplierCost || 0,
            ta: item.ta || 0,
            proveedorId: resolvedSupplierId,
            metodoPagoProveedorId: resolvedSupplierPaymentMethodId,
            origen: item.legs?.[0]?.origin || item.pickupLocation || null,
            destino: item.destination || item.destinationCountry || item.legs?.[0]?.destination || null,
            fechaInicioViaje: item.startDate ? new Date(item.startDate) : item.departureDate ? new Date(item.departureDate) : item.pickupDate ? new Date(item.pickupDate) : null,
            fechaFinViaje: item.endDate ? new Date(item.endDate) : item.arrivalDate ? new Date(item.arrivalDate) : item.returnDate ? new Date(item.returnDate) : null,
            observaciones: item.observations || null
          }
        });
        const productData = await handler.transform(item, detalle.id, tx);
        const product = await tx[handler.table].create({ data: productData });

        const pid = personaId;
        const passengersToCreate = [];
        if (item.passengerInfo || item.guests) {
          const passengers = item.passengerInfo ? [item.passengerInfo] : (item.guests || []);
          for (const p of passengers) {
            const resolvedPid = await findOrCreatePersona(tx, p.name || p.passengerName || p.fullName, p.docType, p.docNumber, pid);
            passengersToCreate.push({
              personaId: resolvedPid,
              esTitular: p.esTitular ?? true,
              asiento: p.asiento || item.seatNumber || item.seat || null
            });
          }
        } else {
          const passengerName = item.passengerName || item.mainDriver || item.responsibleName || item.ownerName || item.fullName || item.reservationName || item.contactName;
          const docType = item.docType;
          const docNumber = item.docNumber || item.licenseNumber || item.passportNumber || item.idNumber;
          if (passengerName || docNumber || ['checkin', 'documentacion_migratoria', 'simcard', 'tours', 'servicio_mascotas', 'renta_vehiculos'].includes(handler.category)) {
            const resolvedPid = await findOrCreatePersona(tx, passengerName, docType, docNumber, pid);
            passengersToCreate.push({
              personaId: resolvedPid,
              esTitular: true,
              asiento: item.seat || item.seatNumber || null
            });
          }
        }

        for (const passengerData of passengersToCreate) {
          await tx.pasajerosDetalle.create({
            data: {
              detalleVentaId: detalle.id,
              personaId: passengerData.personaId,
              esTitular: passengerData.esTitular,
              asiento: passengerData.asiento
            }
          });
        }

        if (handler.table === 'prodTiqueteria') {
          let currentOrden = 1;
          
          if (item.legs && item.legs.length > 0) {
            for (let i = 0; i < item.legs.length; i++) {
              const leg = item.legs[i];
              if (!leg.origin && !leg.destination) continue;
              const originAirportId = leg.origin ? await resolveAirportId(tx, leg.origin) : null;
              const destAirportId = leg.destination ? await resolveAirportId(tx, leg.destination) : null;
              if (!originAirportId || !destAirportId) continue;
              await tx.tramosVuelo.create({
                data: {
                  prodTiqueteriaId: product.id,
                  aeropuertoOrigenId: originAirportId,
                  aeropuertoDestinoId: destAirportId,
                  salida: leg.date ? new Date(leg.date) : new Date(),
                  llegada: leg.arrivalDate ? new Date(leg.arrivalDate) : (leg.date ? new Date(leg.date) : new Date()),
                  nroVueloTramo: leg.flightNumber || null,
                  asiento: leg.seat || null,
                  orden: currentOrden++
                }
              });
            }
          }

          if (item.hasStops && item.outboundStops && item.outboundStops.length > 0) {
            for (const stop of item.outboundStops) {
              if (!stop.origin && !stop.destination) continue;
              const sOriginId = stop.origin ? await resolveAirportId(tx, stop.origin) : null;
              const sDestId = stop.destination ? await resolveAirportId(tx, stop.destination) : null;
              if (!sOriginId || !sDestId) continue;
              await tx.tramosVuelo.create({
                data: {
                  prodTiqueteriaId: product.id,
                  aeropuertoOrigenId: sOriginId,
                  aeropuertoDestinoId: sDestId,
                  salida: stop.date ? new Date(stop.date) : new Date(),
                  llegada: stop.arrivalDate ? new Date(stop.arrivalDate) : (stop.date ? new Date(stop.date) : new Date()),
                  nroVueloTramo: stop.flightNumber || null,
                  asiento: stop.seat || null,
                  nroTiquete: stop.ticketNumber || null,
                  orden: currentOrden++
                }
              });
            }
          }

          if (item.returnLeg && item.returnLeg.origin && item.returnLeg.destination) {
            const rLeg = item.returnLeg;
            const rOriginId = await resolveAirportId(tx, rLeg.origin);
            const rDestId = await resolveAirportId(tx, rLeg.destination);
            if (rOriginId && rDestId) {
              await tx.tramosVuelo.create({
                data: {
                  prodTiqueteriaId: product.id,
                  aeropuertoOrigenId: rOriginId,
                  aeropuertoDestinoId: rDestId,
                  salida: rLeg.date ? new Date(rLeg.date) : new Date(),
                  llegada: rLeg.arrivalDate ? new Date(rLeg.arrivalDate) : (rLeg.date ? new Date(rLeg.date) : new Date()),
                  nroVueloTramo: rLeg.flightNumber || null,
                  asiento: rLeg.seat || null,
                  nroTiquete: rLeg.ticketNumber || null,
                  orden: currentOrden++
                }
              });
            }
          }

          if (item.returnHasStops && item.returnStops && item.returnStops.length > 0) {
            for (const stop of item.returnStops) {
              if (!stop.origin && !stop.destination) continue;
              const sOriginId = stop.origin ? await resolveAirportId(tx, stop.origin) : null;
              const sDestId = stop.destination ? await resolveAirportId(tx, stop.destination) : null;
              if (!sOriginId || !sDestId) continue;
              await tx.tramosVuelo.create({
                data: {
                  prodTiqueteriaId: product.id,
                  aeropuertoOrigenId: sOriginId,
                  aeropuertoDestinoId: sDestId,
                  salida: stop.date ? new Date(stop.date) : new Date(),
                  llegada: stop.arrivalDate ? new Date(stop.arrivalDate) : (stop.date ? new Date(stop.date) : new Date()),
                  nroVueloTramo: stop.flightNumber || null,
                  asiento: stop.seat || null,
                  nroTiquete: stop.ticketNumber || null,
                  orden: currentOrden++
                }
              });
            }
          }
        }
      }

      if (incoming.length === 0 && existingDetails.length > 0) {
        for (const d of existingDetails) {
          await tx.pasajerosDetalle.deleteMany({ where: { detalleVentaId: d.id } });
          const product = await tx[handler.table].findFirst({ where: { detalleVentaId: d.id } });
          if (product) {
            if (handler.table === 'prodTiqueteria') {
              await tx.tramosVuelo.deleteMany({ where: { prodTiqueteriaId: product.id } });
            }
            await tx[handler.table].delete({ where: { id: product.id } });
          }
          await tx.detalleVenta.delete({ where: { id: d.id } });
        }
      }
    }
  }, {
    maxWait: 15000,
    timeout: 30000
  });
}

/**
 * Voids a sale.
 * @param {number} id - Sale ID
 * @param {string} reason - Voiding reason
 * @returns {Promise<void>}
 */
async function voidSale(id, reason) {
  const venta = await prisma.ventas.findUnique({ where: { id } });
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const newObservaciones = venta.observaciones 
    ? `${venta.observaciones}\n[ANULADA] Motivo: ${reason}` 
    : `[ANULADA] Motivo: ${reason}`;

  await prisma.ventas.update({
    where: { id },
    data: { 
      status: 'anulado',
      observaciones: newObservaciones
    }
  });
}

/**
 * Registers a credit payment.
 * @param {number} id - Sale ID
 * @param {Object} paymentData - Includes amount, isTotal, method, reference, currentPaidAmount, saleTotal
 * @returns {Promise<Object>} Object containing creditPaidAmount, status, payment details
 */
async function registerPayment(id, paymentData) {
  const { amount, isTotal, method, reference, currentPaidAmount, saleTotal } = paymentData;
  const metodoPagoId = await resolvePaymentMethodId(prisma, method);

  let newPaidAmount, newStatus;
  if (saleTotal !== undefined && currentPaidAmount !== undefined) {
    newPaidAmount = isTotal ? saleTotal : (currentPaidAmount || 0) + amount;
    newStatus = (isTotal || newPaidAmount >= saleTotal) ? 'pagado' : 'abonado';
  } else {
    const venta = await prisma.ventas.findUnique({ where: { id }, select: { montoTotal: true, montoPagadoCredito: true } });
    if (!venta) {
      const err = new Error('Venta no encontrada');
      err.statusCode = 404;
      throw err;
    }
    const currentPaid = venta.montoPagadoCredito || 0;
    newPaidAmount = isTotal ? venta.montoTotal : currentPaid + amount;
    newStatus = (isTotal || newPaidAmount >= venta.montoTotal) ? 'pagado' : 'abonado';
  }

  let newPayment;
  await prisma.$transaction(async (tx) => {
    newPayment = await tx.pagosVenta.create({
      data: { ventaId: id, monto: amount, metodoPagoId, referencia: reference || null }
    });
    await tx.ventas.update({
      where: { id },
      data: { montoPagadoCredito: newPaidAmount, status: newStatus }
    });
  });

  return {
    creditPaidAmount: newPaidAmount,
    status: newStatus,
    payment: {
      id: newPayment.id,
      date: newPayment.fechaPago,
      amount: newPayment.monto,
      method: method || null
    }
  };
}

/**
 * Deletes a registered payment.
 * @param {number} saleId - Sale ID
 * @param {string} paymentId - Payment ID
 * @param {Object} paymentData - Includes currentPayments, saleTotal
 * @returns {Promise<Object>} Object containing creditPaidAmount, status
 */
async function deletePayment(saleId, paymentId, paymentData) {
  const { currentPayments, saleTotal } = paymentData || {};

  const payment = await prisma.pagosVenta.findUnique({
    where: { id: paymentId },
    select: { id: true, ventaId: true, monto: true }
  });
  if (!payment) {
    const err = new Error('Pago no encontrado');
    err.statusCode = 404;
    throw err;
  }
  if (payment.ventaId !== saleId) {
    const err = new Error('El pago no pertenece a esta venta');
    err.statusCode = 400;
    throw err;
  }

  let newPaidAmount = 0;
  let newStatus = 'credito';

  if (Array.isArray(currentPayments) && saleTotal !== undefined) {
    newPaidAmount = currentPayments
      .filter(p => p.id !== paymentId)
      .reduce((sum, p) => sum + p.amount, 0);
    newStatus = newPaidAmount >= saleTotal ? 'pagado' : newPaidAmount > 0 ? 'abonado' : 'credito';

    await prisma.$transaction([
      prisma.pagosVenta.delete({ where: { id: paymentId } }),
      prisma.ventas.update({
        where: { id: saleId },
        data: { montoPagadoCredito: newPaidAmount, status: newStatus }
      })
    ]);
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.pagosVenta.delete({ where: { id: paymentId } });
      const remainingPayments = await tx.pagosVenta.findMany({ where: { ventaId: saleId }, select: { monto: true } });
      newPaidAmount = remainingPayments.reduce((sum, p) => sum + p.monto, 0);
      const venta = await tx.ventas.findUnique({ where: { id: saleId }, select: { montoTotal: true } });
      newStatus = newPaidAmount >= venta.montoTotal ? 'pagado' : newPaidAmount > 0 ? 'abonado' : 'credito';
      await tx.ventas.update({
        where: { id: saleId },
        data: { montoPagadoCredito: newPaidAmount, status: newStatus }
      });
    });
  }

  return { creditPaidAmount: newPaidAmount, status: newStatus };
}

module.exports = {
  createSale,
  updateSale,
  voidSale,
  registerPayment,
  deletePayment
};
