export function normalizarListaPrecio(lista?: string | null): string {
	if (!lista) return '1';
	const match = String(lista).trim().match(/[1-5]/);
	return match ? match[0] : '1';
}

export function datosComercialesDesdeCliente(cliente: {
	ListaPrecio?: string | null;
	PorcentajeBonificacionGeneral?: number | string | null;
}): { listaPrecio: string; porcentajeBonificacion: number } {
	return {
		listaPrecio: normalizarListaPrecio(cliente.ListaPrecio),
		porcentajeBonificacion: Number(cliente.PorcentajeBonificacionGeneral) || 0
	};
}
