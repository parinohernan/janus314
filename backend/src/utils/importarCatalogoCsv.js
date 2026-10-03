/**
 * CSV de catálogo jfbase (separador ;, campos entre comillas).
 * Código de negocio: columna articulo. No importa stock ni costo de origen.
 */

const IVA_POR_TIPO = {
	'3': 21,
	'4': 10.5,
	'5': 21,
	'6': 21,
};

const MAX_CODIGO = 13;
const MAX_DESCRIPCION = 100;
const MAX_BARRA = 20;
const MAX_PROVEEDOR = 8;
const MAX_NOMBRE_PROVEEDOR = 50;

function parsearLineaCsv(linea) {
	const campos = [];
	let actual = '';
	let entreComillas = false;
	for (let i = 0; i < linea.length; i++) {
		const char = linea[i];
		if (entreComillas) {
			if (char === '"') {
				if (linea[i + 1] === '"') {
					actual += '"';
					i++;
				} else {
					entreComillas = false;
				}
			} else {
				actual += char;
			}
		} else if (char === '"') {
			entreComillas = true;
		} else if (char === ';') {
			campos.push(actual);
			actual = '';
		} else {
			actual += char;
		}
	}
	campos.push(actual);
	return campos;
}

function texto(valor) {
	const limpio = String(valor ?? '').trim();
	if (!limpio || limpio.toUpperCase() === 'NULL') return '';
	return limpio;
}

function redondear2(valor) {
	return Number(valor.toFixed(2));
}

function indiceColumnas(encabezados) {
	const mapa = {};
	encabezados.forEach((nombre, indice) => {
		mapa[texto(nombre).toLowerCase()] = indice;
	});
	const requeridas = ['articulo', 'descri', 'precio', 'tipoiva'];
	const faltan = requeridas.filter((col) => mapa[col] === undefined);
	return { mapa, faltan };
}

function valor(campos, mapa, nombre) {
	const indice = mapa[nombre];
	if (indice === undefined) return '';
	return texto(campos[indice]);
}

/**
 * @returns {{ errorArchivo?: string, validos: object[], errores: object[], proveedores: Map<string, {codigo: string, descripcion: string}>, barrasDuplicadas: object[] }}
 */
function analizarCatalogoCsv(contenido) {
	const textoPlano = String(contenido ?? '').replace(/^\uFEFF/, '');
	const lineas = textoPlano.split(/\r?\n/).filter((linea) => linea.trim() !== '');
	if (lineas.length < 2) {
		return {
			errorArchivo: 'El archivo no tiene filas de datos',
			validos: [],
			errores: [],
			proveedores: new Map(),
			barrasDuplicadas: [],
		};
	}

	const encabezados = parsearLineaCsv(lineas[0]);
	const { mapa, faltan } = indiceColumnas(encabezados);
	if (faltan.length) {
		return {
			errorArchivo: `Faltan columnas: ${faltan.join(', ')}`,
			validos: [],
			errores: [],
			proveedores: new Map(),
			barrasDuplicadas: [],
		};
	}

	const validos = [];
	const errores = [];
	const proveedores = new Map();
	const vistos = new Set();
	const barras = new Map();

	for (let i = 1; i < lineas.length; i++) {
		const fila = i + 1;
		const campos = parsearLineaCsv(lineas[i]);
		const codigo = valor(campos, mapa, 'articulo');
		const descripcion = valor(campos, mapa, 'descri');
		const precioTexto = valor(campos, mapa, 'precio');
		const tipoIva = valor(campos, mapa, 'tipoiva');
		const provee = valor(campos, mapa, 'provee');
		const nompro = valor(campos, mapa, 'nompro');
		let barra = valor(campos, mapa, 'barra');
		if (barra === '0') barra = '';

		if (!codigo) {
			errores.push({ fila, codigo: '', mensaje: 'Sin código de artículo' });
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
		if (!descripcion) {
			errores.push({ fila, codigo, mensaje: 'Sin descripción' });
			continue;
		}
		const precio = Number(precioTexto.replace(',', '.'));
		if (!Number.isFinite(precio) || precio <= 0) {
			errores.push({ fila, codigo, mensaje: 'Precio inválido' });
			continue;
		}
		if (!Object.prototype.hasOwnProperty.call(IVA_POR_TIPO, tipoIva)) {
			errores.push({ fila, codigo, mensaje: `Tipo de IVA desconocido: ${tipoIva || '(vacío)'}` });
			continue;
		}
		if (provee && provee.length > MAX_PROVEEDOR) {
			errores.push({ fila, codigo, mensaje: `El código de proveedor supera ${MAX_PROVEEDOR} caracteres` });
			continue;
		}
		if (barra.length > MAX_BARRA) {
			errores.push({ fila, codigo, mensaje: `El código de barras supera ${MAX_BARRA} caracteres` });
			continue;
		}

		const iva = IVA_POR_TIPO[tipoIva];
		const precioRedondeado = redondear2(precio);
		const costoNeto = redondear2(precio / (1 + iva / 100));

		let proveedorCodigo = null;
		if (provee) {
			proveedorCodigo = provee;
			if (!proveedores.has(provee)) {
				proveedores.set(provee, {
					codigo: provee,
					descripcion: (nompro || provee).slice(0, MAX_NOMBRE_PROVEEDOR),
				});
			}
		}

		vistos.add(codigo);
		if (barra) {
			const grupo = barras.get(barra) || [];
			grupo.push(codigo);
			barras.set(barra, grupo);
		}

		validos.push({
			Codigo: codigo,
			Descripcion: descripcion.slice(0, MAX_DESCRIPCION),
			PorcentajeIVA1: iva,
			PrecioCosto: costoNeto,
			PrecioCostoMasImp: precioRedondeado,
			Lista1: 0,
			Lista2: 0,
			Lista3: 0,
			Lista4: 0,
			Lista5: 0,
			CodigoBarras: barra || null,
			ProveedorCodigo: proveedorCodigo,
		});
	}

	const barrasDuplicadas = [];
	for (const [barra, codigos] of barras) {
		if (codigos.length > 1) barrasDuplicadas.push({ barra, codigos });
	}

	return { validos, errores, proveedores, barrasDuplicadas };
}

module.exports = {
	analizarCatalogoCsv,
	IVA_POR_TIPO,
	parsearLineaCsv,
	texto,
};
