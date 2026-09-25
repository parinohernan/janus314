import { describe, expect, it } from 'vitest';
import { aISOFecha } from '../src/lib/utils/fechaCampos';
import { idRangoActivo, lunesDe, rangoFecha } from '../src/lib/utils/rangosFecha';

function iso(rango: { desde: Date; hasta: Date }) {
	return { desde: aISOFecha(rango.desde), hasta: aISOFecha(rango.hasta) };
}

describe('rangosFecha', () => {
	const viernes = new Date(2026, 8, 25, 15, 40, 0);

	it('arma años, meses y semanas ISO (lunes a domingo) en hora local', () => {
		expect(iso(rangoFecha('anio_actual', viernes))).toEqual({
			desde: '2026-01-01',
			hasta: '2026-12-31'
		});
		expect(iso(rangoFecha('anio_anterior', viernes))).toEqual({
			desde: '2025-01-01',
			hasta: '2025-12-31'
		});
		expect(iso(rangoFecha('mes_actual', viernes))).toEqual({
			desde: '2026-09-01',
			hasta: '2026-09-30'
		});
		expect(iso(rangoFecha('ultimo_mes', viernes))).toEqual({
			desde: '2026-08-01',
			hasta: '2026-08-31'
		});
		expect(iso(rangoFecha('semana_actual', viernes))).toEqual({
			desde: '2026-09-21',
			hasta: '2026-09-27'
		});
		expect(iso(rangoFecha('semana_anterior', viernes))).toEqual({
			desde: '2026-09-14',
			hasta: '2026-09-20'
		});
	});

	it('el último mes de enero es diciembre del año anterior, y febrero bisiesto cierra el 29', () => {
		expect(iso(rangoFecha('ultimo_mes', new Date(2026, 0, 10)))).toEqual({
			desde: '2025-12-01',
			hasta: '2025-12-31'
		});
		expect(iso(rangoFecha('ultimo_mes', new Date(2024, 2, 1)))).toEqual({
			desde: '2024-02-01',
			hasta: '2024-02-29'
		});
	});

	it('la semana de un domingo sigue siendo la que empezó el lunes anterior', () => {
		const domingo = new Date(2026, 8, 27);
		expect(aISOFecha(lunesDe(domingo))).toBe('2026-09-21');
		expect(iso(rangoFecha('semana_actual', domingo))).toEqual({
			desde: '2026-09-21',
			hasta: '2026-09-27'
		});
	});

	it('marca el preset activo si desde y hasta coinciden en el día', () => {
		const rango = rangoFecha('mes_actual', viernes);
		expect(idRangoActivo(rango.desde, rango.hasta, viernes)).toBe('mes_actual');
		expect(idRangoActivo(viernes, viernes, viernes)).toBeNull();
	});
});
