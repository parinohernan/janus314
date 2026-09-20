export type PosRubroId = 'almacen' | 'panaderia' | 'fiambreria' | 'verduleria' | 'carniceria' | 'varios';

export interface PosRubro {
	id: PosRubroId;
	codigo: string;
	label: string;
	iva: number;
	descripcionDefault: string;
	clase: string;
}

export const PREFIJOS_BALANZA = ['5000'];

export const POS_RUBROS: PosRubro[] = [
	{
		id: 'almacen',
		codigo: 'VAR-ALM',
		label: 'Almacén',
		iva: 21,
		descripcionDefault: 'VARIOS ALMACEN',
		clase: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
	},
	{
		id: 'panaderia',
		codigo: 'VAR-PAN',
		label: 'Panadería',
		iva: 10.5,
		descripcionDefault: 'VARIOS PANADERIA',
		clase: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
	},
	{
		id: 'fiambreria',
		codigo: 'VAR-FIA',
		label: 'Fiambrería',
		iva: 21,
		descripcionDefault: 'VARIOS FIAMBRERIA',
		clase: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
	},
	{
		id: 'verduleria',
		codigo: 'VAR-VER',
		label: 'Verdulería',
		iva: 10.5,
		descripcionDefault: 'VARIOS VERDULERIA',
		clase: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
	},
	{
		id: 'carniceria',
		codigo: 'VAR-CAR',
		label: 'Carnicería',
		iva: 10.5,
		descripcionDefault: 'VARIOS CARNICERIA',
		clase: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100'
	},
	{
		id: 'varios',
		codigo: 'VAR-VAR',
		label: 'Varios',
		iva: 21,
		descripcionDefault: 'VARIOS',
		clase: 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
	}
];

export function esCodigoBalanza(code: string): boolean {
	const value = String(code || '').trim();
	return PREFIJOS_BALANZA.some((prefix) => value.startsWith(prefix));
}

export function esArticuloPosVarios(codigo: string): boolean {
	const value = String(codigo || '').trim().toUpperCase();
	return value.startsWith('VAR-');
}

export function rubroPorCodigo(codigo: string): PosRubro | undefined {
	const value = String(codigo || '').trim().toUpperCase();
	return POS_RUBROS.find((r) => value === r.codigo || value.startsWith(`${r.codigo}`));
}
