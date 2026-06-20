async function findOrCreatePersona(tx, name, docType, docNumber, defaultPersonaId) {
  if (!name && !docNumber) {
    return defaultPersonaId || null;
  }
  
  if (docNumber) {
    const match = await tx.personas.findUnique({
      where: { documento: String(docNumber) }
    });
    if (match) return match.id;
  }

  const nameParts = (name || '').trim().split(/\s+/);
  const nombres = nameParts[0] || 'Pasajero';
  const apellidos = nameParts.slice(1).join(' ') || 'Temporal';

  let tipoDocumentoId = null;
  if (docType) {
    const td = await tx.tiposDocumento.findUnique({
      where: { abreviatura: String(docType) }
    });
    if (td) tipoDocumentoId = td.id;
  }

  const newPersona = await tx.personas.create({
    data: {
      nombres,
      apellidos,
      tipoDocumentoId,
      documento: docNumber ? String(docNumber) : null,
      status: 'active'
    }
  });
  return newPersona.id;
}

async function resolvePaymentMethodId(prisma, paymentMethod, cache) {
  if (!paymentMethod) return null;
  const id = parseInt(paymentMethod);
  if (!isNaN(id)) return id;
  if (cache && cache.paymentMethods && cache.paymentMethods.has(paymentMethod)) return cache.paymentMethods.get(paymentMethod);
  
  // Try metodosPago first (by name)
  const method = await prisma.metodosPago.findFirst({ where: { nombre: paymentMethod } });
  if (method) {
    if (cache && cache.paymentMethods) cache.paymentMethods.set(paymentMethod, method.id);
    return method.id;
  }
  // Try tarjetasAgencia (by name) — return associated metodoPago id
  const card = await prisma.tarjetasAgencia.findFirst({
    where: { nombre: paymentMethod },
    include: { metodoPago: true }
  });
  const resId = card?.metodoPago?.id || null;
  if (cache && cache.paymentMethods) cache.paymentMethods.set(paymentMethod, resId);
  return resId;
}

async function resolveAirlineId(prisma, airline) {
  if (!airline) return null;
  const id = parseInt(airline);
  if (!isNaN(id)) return id;
  const match = await prisma.aerolineas.findFirst({ where: { nombre: airline } });
  return match?.id || null;
}

async function resolveSupplierId(prisma, supplier, cache) {
  if (!supplier) return null;
  const id = parseInt(supplier);
  if (!isNaN(id)) return id;
  if (cache && cache.suppliers && cache.suppliers.has(supplier)) return cache.suppliers.get(supplier);

  const match = await prisma.proveedores.findFirst({ where: { nombre: supplier } });
  const resId = match?.id || null;
  if (cache && cache.suppliers) cache.suppliers.set(supplier, resId);
  return resId;
}

async function resolveAirportId(prisma, iata, cache) {
  if (!iata) return null;
  if (cache && cache.airports && cache.airports.has(iata)) return cache.airports.get(iata);
  
  const parsedId = parseInt(iata);
  if (!isNaN(parsedId)) {
    const match = await prisma.aeropuertos.findUnique({ where: { id: parsedId } });
    if (match) {
      if (cache && cache.airports) cache.airports.set(iata, match.id);
      return match.id;
    }
  }

  const match = await prisma.aeropuertos.findFirst({ where: { codigoIata: iata } });
  const resId = match?.id || null;
  if (cache && cache.airports) cache.airports.set(iata, resId);
  return resId;
}

async function resolveBaggagePlanId(prisma, baggagePlan) {
  if (!baggagePlan) return null;
  const id = parseInt(baggagePlan);
  if (!isNaN(id)) return id;
  
  const parts = baggagePlan.split(' - ');
  if (parts.length >= 2) {
    const airlineName = parts[0];
    const fareType = parts.slice(1).join(' - ');
    const match = await prisma.politicasEquipaje.findFirst({
      where: {
        AND: [
          { aerolinea: { nombre: airlineName } },
          { tipoTarifa: fareType }
        ]
      }
    });
    if (match) return match.id;
  }
  
  const match = await prisma.politicasEquipaje.findFirst({ where: { tipoTarifa: baggagePlan } });
  return match?.id || null;
}

module.exports = {
  findOrCreatePersona,
  resolvePaymentMethodId,
  resolveAirlineId,
  resolveSupplierId,
  resolveAirportId,
  resolveBaggagePlanId
};
