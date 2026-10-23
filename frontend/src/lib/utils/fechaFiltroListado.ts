import { aISOFecha, deISOFecha } from '$lib/utils/fechaCampos';
import { rangoFecha, type RangoFecha } from '$lib/utils/rangosFecha';

export { aISOFecha, deISOFecha };

export function periodoInicialListado(): RangoFecha {
	return rangoFecha('mes_actual');
}

export function restaurarPeriodo(desdeStr?: string, hastaStr?: string, base?: RangoFecha): RangoFecha {
	const fallback = base ?? periodoInicialListado();
	return {
		desde: deISOFecha(desdeStr ?? '') ?? fallback.desde,
		hasta: deISOFecha(hastaStr ?? '', fallback.hasta) ?? fallback.hasta
	};
}
