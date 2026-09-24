#!/usr/bin/env node
/**
 * Simula la etiqueta de la balanza.
 *
 *   node scripts/simulador-balanza.js 500001 0.505
 *   node scripts/simulador-balanza.js 01 505g
 *
 * Sin argumentos pregunta el código y el peso.
 * El código es el de barras del artículo (500001) o solo el corte (01, prefijo 5000).
 * El peso va en kilos (0.505 o 0,505) o en gramos si termina en g (505g).
 */

const readline = require('readline/promises');
const { stdin, stdout } = require('process');

const PREFIJO_DEFAULT = '5000';

function digitoVerificador(doce) {
	let suma = 0;
	for (let i = 0; i < 12; i++) {
		const digito = Number(doce[i]);
		suma += i % 2 === 0 ? digito : digito * 3;
	}
	return String((10 - (suma % 10)) % 10);
}

function codigoArticulo(entrada) {
	const valor = String(entrada || '').replace(/\s/g, '');
	if (/^\d{2}$/.test(valor)) return `${PREFIJO_DEFAULT}${valor}`;
	if (/^\d{6}$/.test(valor)) return valor;
	throw new Error(
		'El código tiene que ser el de barras de 6 dígitos (500001) o el número del corte de 2 dígitos (01).'
	);
}

function gramosDe(entrada) {
	const texto = String(entrada || '')
		.trim()
		.toLowerCase()
		.replace(/\s/g, '')
		.replace(',', '.');
	const enGramos = texto.endsWith('g');
	const numero = Number(enGramos ? texto.slice(0, -1) : texto);
	if (!Number.isFinite(numero) || numero <= 0) {
		throw new Error('El peso tiene que ser mayor a 0. Ejemplo: 0.505 o 505g.');
	}
	const gramos = Math.round(enGramos ? numero : numero * 1000);
	if (gramos < 1 || gramos > 999999) {
		throw new Error('El peso tiene que entrar en 6 dígitos: de 1 g a 999,999 g.');
	}
	return gramos;
}

function etiqueta(codigo, peso) {
	const articulo = codigoArticulo(codigo);
	const gramos = gramosDe(peso);
	const cuerpo = `${articulo}${String(gramos).padStart(6, '0')}`;
	const barras = `${cuerpo}${digitoVerificador(cuerpo)}`;
	return {
		barras,
		prefijo: articulo.slice(0, 4),
		plu: articulo.slice(4, 6),
		gramos,
		kg: gramos / 1000
	};
}

function imprimir(resultado) {
	const kg = resultado.kg.toLocaleString('es-AR', {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3
	});
	console.log('');
	console.log(`Código de barras: ${resultado.barras}`);
	console.log(`  ${resultado.prefijo}     sección`);
	console.log(`  ${resultado.plu}       artículo`);
	console.log(`  ${String(resultado.gramos).padStart(6, '0')}   ${kg} kg`);
	console.log(`  ${resultado.barras.slice(12)}        verificador`);
	console.log('');
}

async function preguntar() {
	const rl = readline.createInterface({ input: stdin, output: stdout });
	try {
		const codigo = await rl.question('Código del artículo (500001 o 01): ');
		const peso = await rl.question('Peso (0.505 kg, o 505g): ');
		return { codigo, peso };
	} finally {
		rl.close();
	}
}

async function main() {
	const [codigoArg, pesoArg] = process.argv.slice(2);
	const { codigo, peso } =
		codigoArg && pesoArg ? { codigo: codigoArg, peso: pesoArg } : await preguntar();
	imprimir(etiqueta(codigo, peso));
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
