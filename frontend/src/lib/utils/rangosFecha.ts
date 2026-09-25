import { fechaLocal, mismoDia, partesDeFecha } from './fechaCampos';

export type IdRangoFecha =
	| 'anio_actual'
	| 'anio_anterior'
	| 'ultimo_mes'
	| 'mes_actual'
	| 'semana_anterior'
	| 'semana_actual';

export interface PresetRangoFecha {
	id: IdRangoFecha;
	label: string;
}

export interface RangoFecha {
	desde: Date;
	hasta: Date;
}

export const PRESETS_RANGO_FECHA: PresetRangoFecha[] = [
	{ id: 'anio_actual', label: 'Año actual' },
	{ id: 'anio_anterior', label: 'Año anterior' },
	{ id: 'ultimo_mes', label: 'Último mes' },
	{ id: 'mes_actual', label: 'Mes actual' },
	{ id: 'semana_anterior', label: 'Semana anterior' },
	{ id: 'semana_actual', label: 'Semana actual' }
];

const FIN_DEL_DIA = new Date(2000, 0, 1, 23, 59, 59, 999);

function dia(partes: { dia: number; mes: number; anio: number }, plantilla?: Date): Date {
	return fechaLocal(partes, plantilla);
}

function sumarDias(base: Date, dias: number): Date {
	const siguiente = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);
	return dia(partesDeFecha(siguiente));
}

/** Lunes de la semana ISO que contiene `ref`. */
export function lunesDe(ref: Date): Date {
	const inicio = dia(partesDeFecha(ref));
	const dow = inicio.getDay();
	const delta = dow === 0 ? -6 : 1 - dow;
	return sumarDias(inicio, delta);
}

export function rangoFecha(id: IdRangoFecha, ref: Date = new Date()): RangoFecha {
	const p = partesDeFecha(ref);

	if (id === 'anio_actual') {
		return {
			desde: dia({ dia: 1, mes: 1, anio: p.anio }),
			hasta: dia({ dia: 31, mes: 12, anio: p.anio }, FIN_DEL_DIA)
		};
	}
	if (id === 'anio_anterior') {
		return {
			desde: dia({ dia: 1, mes: 1, anio: p.anio - 1 }),
			hasta: dia({ dia: 31, mes: 12, anio: p.anio - 1 }, FIN_DEL_DIA)
		};
	}
	if (id === 'mes_actual') {
		return {
			desde: dia({ dia: 1, mes: p.mes, anio: p.anio }),
			hasta: dia({ dia: 31, mes: p.mes, anio: p.anio }, FIN_DEL_DIA)
		};
	}
	if (id === 'ultimo_mes') {
		const mes = p.mes === 1 ? 12 : p.mes - 1;
		const anio = p.mes === 1 ? p.anio - 1 : p.anio;
		return {
			desde: dia({ dia: 1, mes, anio }),
			hasta: dia({ dia: 31, mes, anio }, FIN_DEL_DIA)
		};
	}

	const lunes = lunesDe(ref);
	const origen = id === 'semana_anterior' ? sumarDias(lunes, -7) : lunes;
	return {
		desde: origen,
		hasta: dia(partesDeFecha(sumarDias(origen, 6)), FIN_DEL_DIA)
	};
}

export function idRangoActivo(
	desde: Date,
	hasta: Date,
	ref: Date = new Date(),
	ids: IdRangoFecha[] = PRESETS_RANGO_FECHA.map((preset) => preset.id)
): IdRangoFecha | null {
	for (const id of ids) {
		const rango = rangoFecha(id, ref);
		if (mismoDia(desde, rango.desde) && mismoDia(hasta, rango.hasta)) return id;
	}
	return null;
}
