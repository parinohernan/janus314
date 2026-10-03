/**
 * CSV de clientes jfbase (separador ;, campos entre comillas).
 * No importa saldos: ventas/cantventas/ultven son estadísticas acumuladas.
 */

const { parsearLineaCsv, texto } = require('./importarCatalogoCsv');

const CATEGORIA_POR_SIT_IVA = {
	I: 'I',
	E: 'E',
	C: 'F',
};

const TIPO_DOCUMENTO_POR_CODIGO = {
	'1': '80',
	'2': '96',
	'9': '99',
};

const MAX_CODIGO = 8;
const MAX_DESCRIPCION = 50;
const MAX_CALLE = 50;
const MAX_LOCALIDAD = 50;
const MAX_CODIGO_POSTAL = 10;
const MAX_MAIL = 50;
const MAX_TELEFONO = 50;

const VALORES_BASURA = new Set(['I', '0']);

function normalizarNombre(valor) {
	return String(valor ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toUpperCase();
}

function opcional(valor, max) {
	if (!valor || VALORES_BASURA.has(valor.toUpperCase())) return null;
	return valor.slice(0, max);
}

function indiceColumnas(encabezados) {
	const mapa = {};
	encabezados.forEach((nombre, indice) => {
		mapa[texto(nombre).toLowerCase()] = indice;
	});
	const requeridas = ['cliente', 'nombre', 'sit_iva'];
	const faltan = requeridas.filter((col) => mapa[col] === undefined);
	return { mapa, faltan };
}

function valor(campos, mapa, nombre) {
	const indice = mapa[nombre];
	if (indice === undefined) return '';
	return texto(campos[indice]);
}

/**
 * Cada válido incluye `Provincia` (nombre normalizado) para resolver
 * `ProvinciaCodigo` contra la base; el controlador lo quita antes de grabar.
 * @returns {{ errorArchivo?: string, validos: object[], errores: object[], avisos: object[] }}
 */
function analizarClientesCsv(contenido) {
	const textoPlano = String(contenido ?? '').replace(/^\uFEFF/, '');
	const lineas = textoPlano.split(/\r?\n/).filter((linea) => linea.trim() !== '');
	if (lineas.length < 2) {
		return { errorArchivo: 'El archivo no tiene filas de datos', validos: [], errores: [], avisos: [] };
	}

	const { mapa, faltan } = indiceColumnas(parsearLineaCsv(lineas[0]));
	if (faltan.length) {
		return { errorArchivo: `Faltan columnas: ${faltan.join(', ')}`, validos: [], errores: [], avisos: [] };
	}

	const validos = [];
	const errores = [];
	const avisos = [];
	const vistos = new Set();
	const cuits = new Map();

	for (let i = 1; i < lineas.length; i++) {
		const fila = i + 1;
		const campos = parsearLineaCsv(lineas[i]);
		const codigo = valor(campos, mapa, 'cliente').toUpperCase();
		const nombre = valor(campos, mapa, 'nombre');
		const sitIva = valor(campos, mapa, 'sit_iva').toUpperCase();

		if (!codigo) {
			errores.push({ fila, codigo: '', mensaje: 'Sin código de cliente' });
			continue;
		}
		if (codigo.length > MAX_CODIGO) {
			errores.push({ fila, codigo, mensaje: `El código supera ${MAX_CODIGO} caracteres` });
			continue;
		}
		if (vistos.has(codigo)) {
			errores.push({ fila, codigo, mensaje: 'Código repetido en el archivo' });
			continue;
		}
		if (!nombre) {
			errores.push({ fila, codigo, mensaje: 'Sin nombre' });
			continue;
		}
		const categoriaIva = CATEGORIA_POR_SIT_IVA[sitIva];
		if (!categoriaIva) {
			errores.push({ fila, codigo, mensaje: `Situación de IVA desconocida: ${sitIva || '(vacío)'}` });
			continue;
		}

		const cuitTexto = valor(campos, mapa, 'cuit');
		const cuitDigitos = cuitTexto.replace(/\D/g, '');
		let cuit = null;
		if (cuitDigitos.length === 11) {
			cuit = cuitDigitos;
			const grupo = cuits.get(cuit) || [];
			grupo.push(codigo);
			cuits.set(cuit, grupo);
		} else if (categoriaIva !== 'F' || (cuitDigitos && cuitDigitos !== '0')) {
			avisos.push({ fila, codigo, mensaje: `CUIT inválido (${cuitTexto || 'vacío'}): se importa sin CUIT` });
		}

		vistos.add(codigo);
		validos.push({
			Codigo: codigo,
			Descripcion: nombre.slice(0, MAX_DESCRIPCION),
			Calle: opcional(valor(campos, mapa, 'direccion'), MAX_CALLE),
			Localidad: opcional(valor(campos, mapa, 'localidad'), MAX_LOCALIDAD),
			CodigoPostal: opcional(valor(campos, mapa, 'codpos'), MAX_CODIGO_POSTAL),
			Provincia: normalizarNombre(valor(campos, mapa, 'provincia')),
			Telefono: opcional(valor(campos, mapa, 'telefono'), MAX_TELEFONO),
			Mail: opcional(valor(campos, mapa, 'correo'), MAX_MAIL),
			Cuit: cuit,
			CategoriaIva: categoriaIva,
			TipoDocumento: TIPO_DOCUMENTO_POR_CODIGO[valor(campos, mapa, 'tipodoc')] || null,
			fila,
		});
	}

	for (const [cuit, codigos] of cuits) {
		if (codigos.length > 1) {
			avisos.push({ fila: null, codigo: codigos.join(', '), mensaje: `CUIT ${cuit} repetido en varios clientes` });
		}
	}

	return { validos, errores, avisos };
}

module.exports = {
	analizarClientesCsv,
	normalizarNombre,
	CATEGORIA_POR_SIT_IVA,
};
