import type { Articulo } from './types';

export function obtenerPrecioSegunLista(articulo: Articulo, listaId: string): number {
  const precioCosto = articulo.PrecioCosto || 0;
  const lista1 = articulo.Lista1 || 30;
  const lista2 = articulo.Lista2 || 40;
  const lista3 = articulo.Lista3 || 50;
  const lista4 = articulo.Lista4 || 60;
  const lista5 = articulo.Lista5 || 70;
  const porcentajeIva = articulo.PorcentajeIVA1 || 21;
  let precioSinIva;
  switch(listaId) {
    case '1': precioSinIva = precioCosto * (1 + lista1/100); break;
    case '2': precioSinIva = precioCosto * (1 + lista2/100); break;
    case '3': precioSinIva = precioCosto * (1 + lista3/100); break;
    case '4': precioSinIva = precioCosto * (1 + lista4/100); break;
    case '5': precioSinIva = precioCosto * (1 + lista5/100); break;
    default: precioSinIva = precioCosto * (1 + lista1/100);
  }
  return precioSinIva * (1 + porcentajeIva/100);
}

// Buscar productos en la API
export async function fetchProductos(busqueda: string, listaPrecios: string) {
  if (busqueda.length < 3) return [];
  const response = await fetch(`https://janus314-api.osvi.lat/api/articulos?page=1&limit=10&search=${encodeURIComponent(busqueda)}&field=Descripcion&order=ASC&activo=1`, {
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Accept': 'application/json'
    }
  });
  const data = await response.json();
  return (data.items || []).map((item: any) => {
    // Calcular PrecioVenta según la lista seleccionada
    const precioCalculado = obtenerPrecioSegunLista(item, listaPrecios);
    return {
      ...item,
      PrecioVenta: precioCalculado
    };
  });
} 