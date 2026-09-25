import { describe, expect, it } from 'vitest';
import {
	acotarDia,
	ajustarCampo,
	aISOFecha,
	debeAvanzarAlTipear,
	diasEnMes,
	fechaLocal,
	interpretarBorrador,
	parsearPegado,
	partesDeFecha
} from '../src/lib/utils/fechaCampos';

describe('fechaCampos', () => {
	it('arma y formatea en hora local, sin corrimiento UTC', () => {
		const fecha = fechaLocal({ dia: 25, mes: 9, anio: 2026 }, new Date(2026, 8, 1, 23, 59, 59));
		expect(partesDeFecha(fecha)).toEqual({ dia: 25, mes: 9, anio: 2026 });
		expect(fecha.getHours()).toBe(23);
		expect(aISOFecha(fecha)).toBe('2026-09-25');
	});

	it('acota el día al último del mes, incluyendo febrero bisiesto', () => {
		expect(diasEnMes(2024, 2)).toBe(29);
		expect(acotarDia(2023, 2, 31)).toBe(28);
		expect(acotarDia(2024, 2, 31)).toBe(29);
	});

	it('la rueda del mes solo cambia el mes y recorta el día', () => {
		expect(ajustarCampo({ dia: 31, mes: 1, anio: 2026 }, 'mes', 1)).toEqual({
			dia: 28,
			mes: 2,
			anio: 2026
		});
		expect(ajustarCampo({ dia: 15, mes: 12, anio: 2026 }, 'mes', 1)).toEqual({
			dia: 15,
			mes: 1,
			anio: 2026
		});
		expect(ajustarCampo({ dia: 31, mes: 3, anio: 2026 }, 'dia', 1).dia).toBe(1);
	});

	it('confirma el tipeo y avanza cuando el valor ya es inequívoco', () => {
		expect(interpretarBorrador('dia', '4', { dia: 1, mes: 9, anio: 2026 })).toEqual({
			dia: 4,
			mes: 9,
			anio: 2026
		});
		expect(debeAvanzarAlTipear('dia', '4')).toBe(true);
		expect(debeAvanzarAlTipear('mes', '1')).toBe(false);
		expect(debeAvanzarAlTipear('mes', '09')).toBe(true);
		expect(interpretarBorrador('anio', '26', { dia: 1, mes: 9, anio: 2026 })).toBeNull();
		expect(interpretarBorrador('anio', '2026', { dia: 31, mes: 2, anio: 2020 })?.dia).toBe(28);
	});

	it('entiende un pegado dd/mm/aaaa o yyyy-mm-dd', () => {
		expect(parsearPegado('25/09/2026')).toEqual({ dia: 25, mes: 9, anio: 2026 });
		expect(parsearPegado('2026-09-25')).toEqual({ dia: 25, mes: 9, anio: 2026 });
	});
});
