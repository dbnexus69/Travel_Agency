const { resolveAirlineId, resolveBaggagePlanId } = require('./salesHelpers');

const PRODUCT_HANDLERS = {
  ticketData: {
    category: 'tiqueteria', table: 'prodTiqueteria',
    nombreServicio: 'Tiquetería',
    transform: async (d, detalleId, tx) => {
      const [aerolineaId, planEquipajeId] = await Promise.all([
        resolveAirlineId(tx, d.airline),
        resolveBaggagePlanId(tx, d.baggagePlan)
      ]);
      return {
        detalleVentaId: detalleId,
        aerolineaId,
        nroReserva: d.reservationNumber || null,
        nroVuelo: d.flightNumber || null,
        nroTiquete: d.ticketNumber || null,
        modoVuelo: d.flightMode || 'one_way',
        planEquipajeId,
        checkinStatus: 'pendiente'
      };
    }
  },
  hotelData: {
    category: 'hoteleria', table: 'prodHoteleria',
    nombreServicio: 'Hotelería',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      hotelNombre: d.hotelName || null,
      tipoHotel: d.hotelType || 'hotel',
      destino: d.destination || null,
      nroReserva: d.reservationNumber || null,
      fechaEntrada: d.startDate ? new Date(d.startDate) : null,
      fechaSalida: d.endDate ? new Date(d.endDate) : null,
      observaciones: d.observations || null
    })
  },
  insuranceData: {
    category: 'seguros_viaje', table: 'prodSeguros',
    nombreServicio: 'Seguros de Viaje',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      tipoSeguro: d.insuranceType || 'basico',
      coberturaUsd: Number(d.coverageAmount) || 0,
      diasCobertura: Number(d.coverageDays) || 0,
      fechaInicioVigencia: d.startDate ? new Date(d.startDate) : null,
      fechaFinVigencia: d.endDate ? new Date(d.endDate) : null,
      telefonoContacto: d.phone || null
    })
  },
  planData: {
    category: 'planes', table: 'prodPlanes',
    nombreServicio: 'Planes',
    transform: async (d, detalleId, tx) => {
      const aerolineaId = await resolveAirlineId(tx, d.airline);
      return {
        detalleVentaId: detalleId,
        paqueteId: d.packageId ? (parseInt(d.packageId) || null) : null,
        paqueteTarifaId: d.packageRateId ? (parseInt(d.packageRateId) || null) : null,
        nombrePlan: d.planName || null,
        nombreHotel: d.hotelName || null,
        aerolineaId,
        nroVuelo: d.flightNumber || null,
        nroReserva: d.reservationNumber || null,
        nroTiquete: d.ticketNumber || null,
        fechaViajeInicio: d.startDate ? new Date(d.startDate) : null,
        fechaViajeFin: d.endDate ? new Date(d.endDate) : null,
        fechaSalidaVuelo: d.flightDepartureDate ? new Date(d.flightDepartureDate) : null,
        fechaLlegadaVuelo: d.flightDepartureArrivalDate ? new Date(d.flightDepartureArrivalDate) : null,
        fechaRegresoVuelo: d.flightReturnDate ? new Date(d.flightReturnDate) : null,
        fechaLlegadaRegresoVuelo: d.flightReturnArrivalDate ? new Date(d.flightReturnArrivalDate) : null,
        adultosCount: d.adultsCount || 0,
        menoresCount: d.childrenCount || 0,
        numeroConfirmacion: d.confirmationNumber || null,
        observaciones: d.observations || null
      };
    }
  },
  checkInData: {
    category: 'checkin', table: 'prodCheckins',
    nombreServicio: 'Check-in',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      nroVueloReserva: d.flightOrReservation || null,
      fechaViaje: d.travelDate ? new Date(d.travelDate) : null,
      asiento: d.seat || null,
      maletasContadas: d.baggage || null,
      telefonoContacto: d.phone || null,
      necesidadesEspeciales: d.specialNeeds || null,
      usaSillaRuedas: d.needsWheelchair || false
    })
  },
  migrationData: {
    category: 'documentacion_migratoria', table: 'prodMigracion',
    nombreServicio: 'Documentación Migratoria',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      tipoTramiteMigratorio: d.requestedDocType || null,
      nacionalidad: d.nationality || null,
      tipoDocumento: d.docType || 'Pasaporte',
      pasaporteNro: d.docNumber || null,
      pasaporteVence: d.passportExpiry ? new Date(d.passportExpiry) : null,
      paisDestino: d.destinationCountry || null
    })
  },
  simCardData: {
    category: 'simcard', table: 'prodSimcards',
    nombreServicio: 'SIM Card',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      paisDestino: d.destinationCountry || null,
      fechaLlegada: d.arrivalDate ? new Date(d.arrivalDate) : null,
      duracionViaje: d.tripDuration || null,
      planDatos: d.dataPlan || null,
      tipoSim: d.simType || null,
      metodoEntrega: d.deliveryMethod || null
    })
  },
  carRentalData: {
    category: 'renta_vehiculos', table: 'prodAutos',
    nombreServicio: 'Renta de Vehículos',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      conductorNombre: d.mainDriver || null,
      licenciaNro: d.licenseNumber || null,
      fechaRecogida: d.pickupDate ? new Date(d.pickupDate) : null,
      fechaDevolucion: d.returnDate ? new Date(d.returnDate) : null,
      lugarRecogida: d.pickupLocation || null,
      categoriaAuto: d.vehicleCategory || null,
      conductoresAdicionales: d.additionalDrivers || 0,
      tipoSeguro: d.insuranceType === 'basic' ? 'basico' : (d.insuranceType === 'all_risk' ? 'todo_riesgo' : null),
      tarjetaGarantiaInfo: d.guaranteeCreditCard || null
    })
  },
  fincaData: {
    category: 'renta_fincas', table: 'prodFincas',
    nombreServicio: 'Renta de Fincas',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      responsableNombre: d.responsibleName || null,
      documentoResponsable: d.docNumber || null,
      fechaEntrada: d.checkInDate ? new Date(d.checkInDate) : null,
      fechaSalida: d.checkOutDate ? new Date(d.checkOutDate) : null,
      adultosCount: d.adultsCount || 0,
      ninosCount: d.childrenCount || 0,
      tieneMascotas: d.hasPets || false,
      tipoMascota: d.petType || null,
      serviciosExtra: d.additionalServices?.join(', ') || null,
      nombreFinca: d.fincaName || null,
      direccionFinca: d.fincaAddress || null,
      ciudadPueblo: d.fincaCity || null,
      observaciones: d.observations || null
    })
  },
  tourData: {
    category: 'tours', table: 'prodTours',
    nombreServicio: 'Tours',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      tourNombre: d.selectedTour || null,
      fechaPreferida: d.preferredDate ? new Date(d.preferredDate) : null,
      adultosCount: d.adultsCount || 1,
      menoresCount: d.childrenCount || 0,
      edadesMenores: d.childrenAges || null,
      idiomaGuia: d.guideLanguage || null,
      requiereTransporte: d.needsTransport || false,
      puntoEncuentro: d.pickupPoint || null,
      condicionesMedicas: d.medicalConditions || null,
      telefonoContacto: d.phone || null,
      observaciones: d.observations || null
    })
  },
  conventionData: {
    category: 'centros_convencion', table: 'prodEventos',
    nombreServicio: 'Centros de Convención',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      organizacion: d.organization || null,
      nombreContacto: d.contactName || null,
      emailContacto: d.email || null,
      fechaInicio: d.startDate ? new Date(d.startDate) : null,
      fechaFin: d.endDate ? new Date(d.endDate) : null,
      asistenciaEstimada: d.estimatedAttendance || 0,
      espacioRequerido: d.requiredSpace || null,
      tipoEvento: d.eventType || null,
      equiposAv: d.avEquipment?.join(', ') || null,
      requiereCatering: d.hasCatering || false,
      notasCatering: d.cateringNotes || null,
      ciudad: d.city || null,
      direccion: d.address || null,
      nombreLugar: d.placeName || null
    })
  },
  restaurantData: {
    category: 'restaurantes', table: 'prodRestaurantes',
    nombreServicio: 'Restaurantes',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      nombreReserva: d.reservationName || null,
      fechaHoraReserva: d.dateTime ? new Date(d.dateTime) : null,
      personasCount: d.peopleCount || 0,
      preferenciaMesa: d.tablePreference || null,
      tipoMenu: d.menuType || null,
      restriccionesDieta: d.dietaryRestrictions?.join(', ') || null,
      ocasionEspecial: d.specialOccasion || null,
      telefonoContacto: d.phone || null
    })
  },
  visaData: {
    category: 'visa', table: 'prodVisas',
    nombreServicio: 'Visa',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      nombreCompleto: d.fullName || null,
      fechaNacimiento: d.birthDate ? new Date(d.birthDate) : null,
      nacionalidad: d.nationality || null,
      tipoDocumento: d.docType || 'Pasaporte',
      nroPasaporte: d.docNumber || null,
      vencimientoPasaporte: d.passportExpiration ? new Date(d.passportExpiration) : null,
      paisAplicacion: d.countryApplying || null,
      tipoVisa: d.visaType || null,
      fechaEstimadaViaje: d.estimatedTravelDate ? new Date(d.estimatedTravelDate) : null,
      emailContacto: d.email || null
    })
  },
  passportData: {
    category: 'pasaporte', table: 'prodPasaportes',
    nombreServicio: 'Pasaporte',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      nombreCompleto: d.fullName || null,
      nroDocumento: d.idNumber || null,
      fechaNacimiento: d.birthDate ? new Date(d.birthDate) : null,
      ciudadResidencia: d.residenceCity || null,
      tipoTramite: d.processType || null,
      fechaEstimadaViaje: d.estimatedTravelDate ? new Date(d.estimatedTravelDate) : null,
      telefonoContacto: d.phone || null
    })
  },
  petServiceData: {
    category: 'servicio_mascotas', table: 'prodMascotas',
    nombreServicio: 'Servicio de Mascotas',
    transform: (d, detalleId) => ({
      detalleVentaId: detalleId,
      mascotaNombre: d.petName || null,
      especie: d.species || null,
      raza: d.breed || null,
      pesoKg: d.weight || 0,
      tamanoMascota: d.size === "pequeño" ? "pequeno" : (d.size || null),
      transporteTipo: d.travelType || null,
      fechaViaje: d.travelDate ? new Date(d.travelDate) : null,
      paisDestino: d.destinationCountry || null,
      condicionesMedicas: d.medicalConditions || null,
      telefonoContacto: d.phone || null,
      empresaTransporte: d.transportCompany || null,
      observaciones: d.observations || null
    })
  }
};

module.exports = PRODUCT_HANDLERS;
