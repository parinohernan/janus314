import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export const NotaDebitoService = {
  async listar(params: {
    page?: number;
    limit?: number;
    tipo?: string;
    cliente?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithAuth(`/notasdebito?${query}`);
    return response.json();
  },

  async obtener(tipo: string, sucursal: string, numero: string) {
    const response = await fetchWithAuth(`/notasdebito/${tipo}/${sucursal}/${numero}`);
    return response.json();
  },

  async crear(data: { cabeza: any; items: any[] }) {
    const response = await fetchWithAuth('/notasdebito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async anular(tipo: string, sucursal: string, numero: string, motivo?: string) {
    const response = await fetchWithAuth(`/notasdebito/${tipo}/${sucursal}/${numero}/anular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivoAnulacion: motivo })
    });
    return response.json();
  }
};
