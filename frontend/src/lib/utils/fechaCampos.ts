export type CampoFecha = 'dia' | 'mes' | 'anio';

export interface PartesFecha {
	dia: number;
	mes: number;
	anio: number;
}

const MIN_ANIO = 1990;
const MAX_ANIO = 2100;

export function esFechaValida(valor: unknown): valor is Date {
	return valor instanceof Date && !Number.isNaN(valor.getTime());
}

export function partesDeFecha(valor: Date): PartesFecha {
	const fecha = esFechaValida(valor) ? valor : new Date();
	return {
		dia: fecha.getDate(),
		mes: fecha.getMonth() + 1,
		anio: fecha.getFullYear()
	};
}

export function diasEnMes(anio: number, mes: number): number {
	return new Date(anio, mes, 0).getDate();
}

export function acotarDia(anio: number, mes: number, dia: number): number {
	const max = diasEnMes(anio, mes);
	return Math.min(Math.max(1, dia), max);
}

export function fechaLocal(partes: PartesFecha, plantilla?: Date): Date {
	const mes = Math.min(12, Math.max(1, Math.round(partes.mes)));
	const anio = Math.min(MAX_ANIO, Math.max(MIN_ANIO, Math.round(partes.anio)));
	const dia = acotarDia(anio, mes, Math.round(partes.dia));
	const horas = plantilla && esFechaValida(plantilla) ? plantilla.getHours() : 0;
	const minutos = plantilla && esFechaValida(plantilla) ? plantilla.getMinutes() : 0;
	const segundos = plantilla && esFechaValida(plantilla) ? plantilla.getSeconds() : 0;
	const ms = plantilla && esFechaValida(plantilla) ? plantilla.getMilliseconds() : 0;
	return new Date(anio, mes - 1, dia, horas, minutos, segundos, ms);
}

export function mismoDia(a: Date | null | undefined, b: Date | null | undefined): boolean {
	if (!esFechaValida(a) || !esFechaValida(b)) return false;
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function ajustarCampo(partes: PartesFecha, campo: CampoFecha, delta: number): PartesFecha {
	const paso = delta === 0 ? 0 : delta > 0 ? 1 : -1;
	if (campo === 'dia') {
		const max = diasEnMes(partes.anio, partes.mes);
		let dia = partes.dia + paso;
		if (dia > max) dia = 1;
		if (dia < 1) dia = max;
		return { ...partes, dia };
	}
	if (campo === 'mes') {
		let mes = partes.mes + paso;
		if (mes > 12) mes = 1;
		if (mes < 1) mes = 12;
		return { anio: partes.anio, mes, dia: acotarDia(partes.anio, mes, partes.dia) };
	}
	const anio = Math.min(MAX_ANIO, Math.max(MIN_ANIO, partes.anio + paso));
	return { anio, mes: partes.mes, dia: acotarDia(anio, partes.mes, partes.dia) };
}

export function aplicarLimites(fecha: Date, min?: Date, max?: Date): Date {
	if (min && esFechaValida(min) && fecha < min) return fechaLocal(partesDeFecha(min), fecha);
	if (max && esFechaValida(max) && fecha > max) return fechaLocal(partesDeFecha(max), fecha);
	return fecha;
}

export function padCampo(valor: number, campo: CampoFecha): string {
	if (campo === 'anio') return String(valor).padStart(4, '0');
	return String(valor).padStart(2, '0');
}

/** Interpreta lo tipeado en un campo. Vacío o incompleto no confirma. */
export function interpretarBorrador(campo: CampoFecha, borrador: string, partes: PartesFecha): PartesFecha | null {
	const soloDigitos = borrador.replace(/\D/g, '');
	if (!soloDigitos) return null;
	const n = parseInt(soloDigitos, 10);
	if (!Number.isFinite(n)) return null;

	if (campo === 'dia') {
		if (soloDigitos.length < 2 && n === 0) return null;
		const max = diasEnMes(partes.anio, partes.mes);
		if (n < 1 || n > max) return soloDigitos.length >= 2 ? { ...partes, dia: acotarDia(partes.anio, partes.mes, n) } : null;
		return { ...partes, dia: n };
	}
	if (campo === 'mes') {
		if (soloDigitos.length < 2 && n === 0) return null;
		if (n < 1 || n > 12) return soloDigitos.length >= 2 ? { ...partes, mes: 12, dia: acotarDia(partes.anio, 12, partes.dia) } : null;
		return { anio: partes.anio, mes: n, dia: acotarDia(partes.anio, n, partes.dia) };
	}
	if (soloDigitos.length < 4) return null;
	const anio = Math.min(MAX_ANIO, Math.max(MIN_ANIO, n));
	return { anio, mes: partes.mes, dia: acotarDia(anio, partes.mes, partes.dia) };
}

export function debeAvanzarAlTipear(campo: CampoFecha, borrador: string): boolean {
	const soloDigitos = borrador.replace(/\D/g, '');
	if (campo === 'anio') return soloDigitos.length >= 4;
	if (soloDigitos.length >= 2) return true;
	const n = parseInt(soloDigitos, 10);
	if (!Number.isFinite(n) || n === 0) return false;
	if (campo === 'dia') return n > 3;
	return n > 1;
}

const SIGUIENTE: Record<CampoFecha, CampoFecha | null> = {
	dia: 'mes',
	mes: 'anio',
	anio: null
};

export function siguienteCampo(campo: CampoFecha): CampoFecha | null {
	return SIGUIENTE[campo];
}

export function parsearPegado(texto: string): PartesFecha | null {
	const limpio = texto.trim();
	const iso = limpio.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (iso) {
		return {
			anio: Number(iso[1]),
			mes: Number(iso[2]),
			dia: Number(iso[3])
		};
	}
	const local = limpio.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
	if (local) {
		let anio = Number(local[3]);
		if (anio < 100) anio += anio >= 50 ? 1900 : 2000;
		return {
			dia: Number(local[1]),
			mes: Number(local[2]),
			anio
		};
	}
	return null;
}

export function aISOFecha(valor: Date): string {
	const partes = partesDeFecha(valor);
	return `${partes.anio}-${padCampo(partes.mes, 'mes')}-${padCampo(partes.dia, 'dia')}`;
}
