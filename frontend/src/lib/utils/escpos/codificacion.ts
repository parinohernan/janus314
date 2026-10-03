/** Caracteres de WPC1252 entre 0x80 y 0x9F que no coinciden con Latin-1. */
const ESPECIALES_1252: Record<string, number> = {
	'€': 0x80,
	'‚': 0x82,
	'„': 0x84,
	'…': 0x85,
	'‘': 0x91,
	'’': 0x92,
	'“': 0x93,
	'”': 0x94,
	'•': 0x95,
	'–': 0x96,
	'—': 0x97
};

const ESPACIOS = /[\u00A0\u2007\u202F]/g;

export function normalizarTexto(texto: string): string {
	return String(texto ?? '')
		.normalize('NFC')
		.replace(ESPACIOS, ' ');
}

/** Bytes en WPC1252 (ESC t 16). Lo que no tiene equivalente sale como "?". */
export function codificar1252(texto: string): number[] {
	const bytes: number[] = [];
	for (const caracter of normalizarTexto(texto)) {
		const codigo = caracter.codePointAt(0) ?? 0x3f;
		if (codigo === 0x0a) {
			bytes.push(codigo);
		} else if (codigo < 0x20 || codigo === 0x7f) {
			continue;
		} else if (codigo < 0x7f || (codigo >= 0xa0 && codigo <= 0xff)) {
			bytes.push(codigo);
		} else {
			bytes.push(ESPECIALES_1252[caracter] ?? 0x3f);
		}
	}
	return bytes;
}
