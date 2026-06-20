import { Sale, Flight, KPIData, DesgloseCategorias, EMPTY_DESGLOSE } from '../types';

type DateRangeFilter = {
  start?: Date;
  end?: Date;
};

function classifyByObservations(observations: string = ''): DesgloseCategorias {
  const text = observations.toLowerCase();
  const result = { ...EMPTY_DESGLOSE };
  
  if (text.includes('hotel') || text.includes('decameron') || text.includes('dann carlton')) {
    result.hoteles = 1;
  } else if (text.includes('vuelo') || text.includes('tiquete') || text.includes('avion')) {
    result.tiquetes = 1;
  } else if (text.includes('paquete') || text.includes('plan') || text.includes('crucero')) {
    result.planes = 1;
  } else if (text.includes('seguro')) {
    result.seguros = 1;
  } else if (text.includes('visa') || text.includes('pasaporte') || text.includes('trámite')) {
    result.documentos = 1;
  } else {
    result.otros = 1;
  }
  
  return result;
}

function classifyValueByObservations(value: number, observations: string = ''): DesgloseCategorias {
  const text = observations.toLowerCase();
  const result = { ...EMPTY_DESGLOSE };
  
  if (text.includes('hotel') || text.includes('decameron') || text.includes('dann carlton')) {
    result.hoteles = value;
  } else if (text.includes('vuelo') || text.includes('tiquete') || text.includes('avion')) {
    result.tiquetes = value;
  } else if (text.includes('paquete') || text.includes('plan') || text.includes('crucero')) {
    result.planes = value;
  } else if (text.includes('seguro')) {
    result.seguros = value;
  } else if (text.includes('visa') || text.includes('pasaporte') || text.includes('trámite')) {
    result.documentos = 1;
  } else {
    result.otros = value;
  }
  
  return result;
}

function distributeValue(value: number): DesgloseCategorias {
  if (value === 0) return { ...EMPTY_DESGLOSE };
  
  const split = value / 6;
  return {
    documentos: Math.round(split * 0.1),
    hoteles: Math.round(split * 0.35),
    planes: Math.round(split * 0.25),
    seguros: Math.round(split * 0.1),
    tiquetes: Math.round(split * 0.15),
    otros: Math.round(split * 0.05),
  };
}

function sumDesglose(a: DesgloseCategorias, b: DesgloseCategorias): DesgloseCategorias {
  return {
    documentos: a.documentos + b.documentos,
    hoteles: a.hoteles + b.hoteles,
    planes: a.planes + b.planes,
    seguros: a.seguros + b.seguros,
    tiquetes: a.tiquetes + b.tiquetes,
    otros: a.otros + b.otros,
  };
}

function filterSalesByDateRange(sales: Sale[], filter?: DateRangeFilter): Sale[] {
  if (!filter || !filter.start) return sales;
  
  return sales.filter(sale => {
    const saleDate = new Date(sale.date);
    if (filter.start && saleDate < filter.start) return false;
    if (filter.end && saleDate > filter.end) return false;
    return true;
  });
}

function filterFlightsByDateRange(flights: Flight[], filter?: DateRangeFilter): Flight[] {
  if (!filter || !filter.start) return flights;
  
  return flights.filter(flight => {
    const flightDate = new Date(flight.date);
    if (filter.start && flightDate < filter.start) return false;
    if (filter.end && flightDate > filter.end) return false;
    return true;
  });
}

export function calculateKPIData(
  sales: Sale[],
  flights: Flight[],
  filter?: DateRangeFilter
): KPIData {
  const filteredSales = filterSalesByDateRange(sales, filter);
  const filteredFlights = filterFlightsByDateRange(flights, filter);
  
  const flightsIda = filteredFlights.filter(f => f.type === 'ida');
  
  const paidSales = filteredSales.filter(s => s.status === 'pagado' || s.status === 'abonado');
  const pendingSales = filteredSales.filter(s => s.status === 'credito');
  
  const taIngresadaDesglose = paidSales.reduce(
    (acc, sale) => sumDesglose(acc, distributeValue(sale.total)),
    { ...EMPTY_DESGLOSE }
  );
  
  const taPendienteDesglose = pendingSales.reduce(
    (acc, sale) => sumDesglose(acc, distributeValue(sale.total)),
    { ...EMPTY_DESGLOSE }
  );
  
  const ordenesDesglose = filteredSales.reduce(
    (acc, sale) => {
      const classified = classifyByObservations(sale.observations);
      return sumDesglose(acc, classified);
    },
    { ...EMPTY_DESGLOSE }
  );

  const totalVentas = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const proveedoresDesglose = distributeValue(totalVentas > 0 ? totalVentas * 0.72 : 0);

  const hasSalesData = filteredSales.length > 0;
  const hasFlightsData = filteredFlights.length > 0;
  
  return {
    vuelosVendidos: flightsIda.length,
    ordenes: {
      total: filteredSales.length,
      desglose: hasSalesData ? ordenesDesglose : { ...EMPTY_DESGLOSE },
    },
    taIngresada: {
      total: paidSales.reduce((sum, s) => sum + s.total, 0),
      desglose: hasSalesData ? taIngresadaDesglose : { ...EMPTY_DESGLOSE },
    },
    taPendiente: {
      total: pendingSales.reduce((sum, s) => sum + s.total, 0),
      desglose: hasSalesData ? taPendienteDesglose : { ...EMPTY_DESGLOSE },
    },
    proveedores: {
      total: Math.round(totalVentas * 0.72),
      desglose: hasSalesData ? proveedoresDesglose : { ...EMPTY_DESGLOSE },
    },
  };
}

export function calculateMonthlyKPIData(
  sales: Sale[],
  flights: Flight[],
  year: number,
  month: number
): KPIData {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  
  return calculateKPIData(sales, flights, { start, end });
}