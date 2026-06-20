import api from './client';

export async function getDashboard(params: Record<string, unknown> = {}) {
  const res = await api.get('/stats/dashboard', { params });
  return res.data.data;
}

export async function getSalesHistory(year: number) {
  const res = await api.get('/stats/sales-history', { params: { year } });
  return res.data.data;
}

export async function getAsesorPerformance(params: Record<string, unknown> = {}) {
  const res = await api.get('/stats/asesor-performance', { params });
  return res.data.data;
}

export async function getTopClients(params: Record<string, unknown> = {}) {
  const res = await api.get('/stats/top-clients', { params });
  return res.data.data;
}

export async function getCategoryDistribution(params: Record<string, unknown> = {}) {
  const res = await api.get('/stats/category-distribution', { params });
  return res.data.data;
}
