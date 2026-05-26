const prisma = require('../config/db');
const { success } = require('../utils/apiResponse');

exports.dashboard = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const currentYear = new Date().getFullYear();
    let dateCondition = '';
    if (dateFrom && dateTo) {
      dateCondition = `AND creado_at >= '${new Date(dateFrom).toISOString()}' AND creado_at <= '${new Date(dateTo).toISOString()}'`;
    } else if (dateFrom) {
      dateCondition = `AND creado_at >= '${new Date(dateFrom).toISOString()}'`;
    } else if (dateTo) {
      dateCondition = `AND creado_at <= '${new Date(dateTo).toISOString()}'`;
    }

    let userCondition = '';
    if (req.permissionScope === 'own') {
      userCondition = `AND usuario_id = '${req.user.id}'`;
    }

    const where = {};
    if (dateFrom || dateTo) {
      where.creadoAt = {};
      if (dateFrom) where.creadoAt.gte = new Date(dateFrom);
      if (dateTo) where.creadoAt.lte = new Date(dateTo);
    }
    if (req.permissionScope === 'own') {
      where.usuarioId = req.user.id;
    }

    const aggregatesSql = `
      SELECT
        COUNT(*)::int as "totalOperations",
        COALESCE(SUM(CASE WHEN status IN ('pagado', 'abonado') THEN monto_total ELSE 0 END), 0) as "totalRevenue",
        COALESCE(SUM(CASE WHEN status = 'credito' THEN (monto_total - COALESCE(monto_pagado_credito, 0)) ELSE 0 END), 0) as "pendingBalance",
        COUNT(CASE WHEN status = 'credito' THEN 1 END)::int as "pendingCount",
        COALESCE(SUM(costo_proveedor_total), 0) as "suppliersTotal",
        COALESCE(SUM(CASE WHEN status = 'pagado' THEN monto_total ELSE 0 END), 0) as "paids",
        COALESCE(SUM(CASE WHEN status = 'credito' THEN monto_total ELSE 0 END), 0) as "credits",
        COALESCE(SUM(CASE WHEN status = 'abonado' THEN monto_total ELSE 0 END), 0) as "partPaids",
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM creado_at) = ${currentYear} THEN monto_total ELSE 0 END), 0) as "currentYearSales",
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM creado_at) = ${currentYear - 1} THEN monto_total ELSE 0 END), 0) as "prevYearSales"
      FROM ventas
      WHERE deleted_at IS NULL ${dateCondition} ${userCondition}
    `;

    // Run all DB queries in parallel
    const [aggregatesRaw, monthlyTrend, categoryStats, [totalClients, activeClients], recentSales, supplierCount] = await Promise.all([
      prisma.$queryRawUnsafe(aggregatesSql),
      prisma.ventasMensuales.findMany({ orderBy: [{ year: 'asc' }, { month: 'asc' }], take: 24 }),
      prisma.detalleVenta.groupBy({
        by: ['categoria'],
        _sum: { subtotal: true },
        _count: true,
        where: { venta: { ...where, deletedAt: null } }
      }),
      Promise.all([
        prisma.clientes.count({ where: { deletedAt: null } }),
        prisma.clientes.count({ where: { deletedAt: null, persona: { status: 'active' } } }),
      ]),
      prisma.ventas.findMany({
        where: { ...where, deletedAt: null },
        orderBy: { creadoAt: 'desc' },
        take: 5,
        include: {
          cliente: { select: { persona: { select: { nombres: true, apellidos: true } } } },
          usuario: { select: { persona: { select: { nombres: true, apellidos: true } } } },
        }
      }),
      prisma.proveedores.count(),
    ]);

    // O(1) properties assignment
    const agg = aggregatesRaw[0];
    const totalRevenue = Number(agg.totalRevenue) || 0;
    const pendingBalance = Number(agg.pendingBalance) || 0;
    const pendingCount = Number(agg.pendingCount) || 0;
    const totalOperations = Number(agg.totalOperations) || 0;
    const suppliersTotal = Number(agg.suppliersTotal) || 0;
    const paids = Number(agg.paids) || 0;
    const credits = Number(agg.credits) || 0;
    const partPaids = Number(agg.partPaids) || 0;
    const currentYearSales = Number(agg.currentYearSales) || 0;
    const prevYearSales = Number(agg.prevYearSales) || 0;

    const categoryMap = {
      tiqueteria: 'Tiquetes', hoteleria: 'Hoteles', planes: 'Planes',
      seguros_viaje: 'Seguros', checkin: 'Check-in', documentacion_migratoria: 'Documentos',
      simcard: 'SIM Cards', renta_vehiculos: 'Vehículos', renta_fincas: 'Fincas',
      tours: 'Tours', centros_convencion: 'Eventos', restaurantes: 'Restaurantes',
      visa: 'Visa', pasaporte: 'Pasaporte', servicio_mascotas: 'Mascotas'
    };

    const totalCategoria = categoryStats.reduce((sum, d) => sum + (d._sum.subtotal || 0), 0);
    const categoryDistribution = categoryStats.map(d => ({
      name: categoryMap[d.categoria] || d.categoria,
      value: d._sum.subtotal || 0,
      percentage: totalCategoria > 0 ? Math.round((d._sum.subtotal / totalCategoria) * 10000) / 100 : 0
    }));

    const carteraTotal = paids + credits + partPaids || 1;
    const carteraStatus = [
      { name: 'Pagado', value: Math.round((paids / carteraTotal) * 100), color: '#16a34a' },
      { name: 'Abonado', value: Math.round((partPaids / carteraTotal) * 100), color: '#f59e0b' },
      { name: 'Crédito', value: Math.round((credits / carteraTotal) * 100), color: '#dc2626' },
    ];

    const categoryBreakdown = {
      hoteles: { count: 0, revenue: 0 },
      seguros_viaje: { count: 0, revenue: 0 },
      planes: { count: 0, revenue: 0 },
      tiqueteria: { count: 0, revenue: 0 },
    };
    let totalFlights = 0;
    for (const cs of categoryStats) {
      const rawCat = cs.categoria;
      const cat = rawCat === 'hoteleria' ? 'hoteles' : rawCat;
      const sum = cs._sum.subtotal || 0;
      const cnt = cs._count;
      if (categoryBreakdown[cat]) {
        categoryBreakdown[cat].count = cnt;
        categoryBreakdown[cat].revenue = Math.round(sum);
      }
      if (cat === 'tiqueteria') totalFlights = cnt;
    }


    const groupedTrend = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const currentData = monthlyTrend.find(t => t.month === m && t.year === currentYear);
      const previousData = monthlyTrend.find(t => t.month === m && t.year === currentYear - 1);
      return {
        month: m,
        currentYear: currentData ? Math.round(currentData.total) : 0,
        previousYear: previousData ? Math.round(previousData.total) : 0
      };
    });



    success(res, {
      totalRevenue: Math.round(totalRevenue),
      previousYearRevenue: Math.round(prevYearSales),
      revenueGrowth: prevYearSales > 0 ? Math.round(((currentYearSales - prevYearSales) / prevYearSales) * 100) : 0,
      totalOperations,
      operationsGrowth: 0,
      pendingBalance: Math.round(pendingBalance),
      pendingCount,
      suppliersTotal: Math.round(suppliersTotal),
      monthlyRevenue: Math.round(currentYearSales),
      categoryDistribution: categoryDistribution.slice(0, 8),
      carteraStatus,
      monthlyTrend: groupedTrend,
      totalClients,
      activeClients,
      totalFlights,
      categoryBreakdown,
      recentSales: recentSales.map(v => ({
        id: v.id,
        clientName: `${v.cliente.persona.nombres} ${v.cliente.persona.apellidos}`,
        asesorName: `${v.usuario.persona.nombres} ${v.usuario.persona.apellidos}`,
        date: v.creadoAt,
        total: v.montoTotal,
        status: v.status,
      })),
      supplierCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.salesHistory = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await prisma.ventasMensuales.findMany({
      where: { year },
      orderBy: { month: 'asc' }
    });
    success(res, data.map(d => ({
      id: d.id,
      year: d.year,
      month: d.month,
      total: Math.round(d.total),
      count: d.count,
      category: {
        hotels: Math.round(d.hoteles || 0),
        flights: Math.round(d.vuelos || 0),
        packages: Math.round(d.paquetes || 0),
        insurance: Math.round(d.seguros || 0),
        transfers: Math.round(d.transferencias || 0),
      }
    })));
  } catch (err) {
    next(err);
  }
};

exports.asesorPerformance = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let dateCondition = '';
    if (dateFrom && dateTo) {
      dateCondition = `AND v.creado_at >= '${new Date(dateFrom).toISOString()}' AND v.creado_at <= '${new Date(dateTo).toISOString()}'`;
    } else if (dateFrom) {
      dateCondition = `AND v.creado_at >= '${new Date(dateFrom).toISOString()}'`;
    } else if (dateTo) {
      dateCondition = `AND v.creado_at <= '${new Date(dateTo).toISOString()}'`;
    }

    const sql = `
      SELECT 
        v.usuario_id as "asesorId",
        p.nombres || ' ' || p.apellidos as "asesorName",
        COUNT(v.id)::int as "totalVentas",
        COALESCE(SUM(v.monto_total), 0) as "totalIngresos",
        COALESCE(SUM(v.monto_comision_neto), 0) as "comisiones"
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      JOIN personas p ON u.persona_id = p.id
      WHERE v.deleted_at IS NULL ${dateCondition}
      GROUP BY v.usuario_id, p.nombres, p.apellidos
    `;

    const result = await prisma.$queryRawUnsafe(sql);

    success(res, result.map(g => ({
      ...g,
      totalIngresos: Math.round(Number(g.totalIngresos)),
      comisiones: Math.round(Number(g.comisiones))
    })));
  } catch (err) {
    next(err);
  }
};

exports.topClients = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { dateFrom, dateTo } = req.query;
    let dateCondition = '';
    if (dateFrom && dateTo) {
      dateCondition = `AND v.creado_at >= '${new Date(dateFrom).toISOString()}' AND v.creado_at <= '${new Date(dateTo).toISOString()}'`;
    } else if (dateFrom) {
      dateCondition = `AND v.creado_at >= '${new Date(dateFrom).toISOString()}'`;
    } else if (dateTo) {
      dateCondition = `AND v.creado_at <= '${new Date(dateTo).toISOString()}'`;
    }

    const sql = `
      SELECT 
        c.id as "clienteId",
        p.nombres || ' ' || p.apellidos as "clientName",
        COUNT(v.id)::int as "totalVentas",
        COALESCE(SUM(v.monto_total), 0) as "totalPagado"
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN personas p ON c.persona_id = p.id
      WHERE v.deleted_at IS NULL ${dateCondition}
      GROUP BY c.id, p.nombres, p.apellidos
      ORDER BY "totalPagado" DESC
      LIMIT ${limit}
    `;

    const result = await prisma.$queryRawUnsafe(sql);

    success(res, result.map(g => ({
      ...g,
      totalPagado: Math.round(Number(g.totalPagado))
    })));
  } catch (err) {
    next(err);
  }
};

exports.categoryDistribution = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
      where.venta = { deletedAt: null, creadoAt: {} };
      if (dateFrom) where.venta.creadoAt.gte = new Date(dateFrom);
      if (dateTo) where.venta.creadoAt.lte = new Date(dateTo);
    }

    const detalles = await prisma.detalleVenta.groupBy({
      by: ['categoria'],
      _sum: { subtotal: true },
      where: { venta: { ...where.venta, deletedAt: null } }
    });

    const categoryMap = {
      tiqueteria: 'Tiquetes', hoteleria: 'Hoteles', planes: 'Planes',
      seguros_viaje: 'Seguros', checkin: 'Check-in', documentacion_migratoria: 'Documentos',
      simcard: 'SIM Cards', renta_vehiculos: 'Vehículos', renta_fincas: 'Fincas',
      tours: 'Tours', centros_convencion: 'Eventos', restaurantes: 'Restaurantes',
      visa: 'Visa', pasaporte: 'Pasaporte', servicio_mascotas: 'Mascotas'
    };

    const total = detalles.reduce((s, d) => s + (d._sum.subtotal || 0), 0);
    success(res, detalles.map(d => ({
      name: categoryMap[d.categoria] || d.categoria,
      value: d._sum.subtotal || 0,
      percentage: total > 0 ? Math.round((d._sum.subtotal / total) * 10000) / 100 : 0
    })));
  } catch (err) {
    next(err);
  }
};
