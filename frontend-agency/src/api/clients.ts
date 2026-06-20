import api from './client';

export async function listClients(params: Record<string, unknown>) {
  const res = await api.get('/clients', { params });
  return res.data;
}

export async function getClient(id: number) {
  const res = await api.get(`/clients/${id}`, { params: { includeSales: true } });
  return res.data.data;
}

export async function createClient(data: Record<string, unknown>) {
  const res = await api.post('/clients', data);
  return res.data.data;
}

export async function updateClient(id: number, data: Record<string, unknown>) {
  const res = await api.put(`/clients/${id}`, data);
  return res.data.data;
}

export async function toggleClientStatus(id: number) {
  const res = await api.patch(`/clients/${id}/toggle-status`);
  return res.data.data;
}
