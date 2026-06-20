import api from './client';

export async function listFlights(params: Record<string, unknown>) {
  const res = await api.get('/flights', { params });
  return res.data;
}

export async function updateCheckin(id: string, data: Record<string, unknown> | FormData) {
  const isFormData = data instanceof FormData;
  const res = await api.put(`/flights/${id}/checkin`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return res.data.data;
}
