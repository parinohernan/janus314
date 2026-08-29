const CAMPOS_VACIOS_A_NULL = [
  'CategoriaIva',
  'CodigoVendedor',
  'CondicionVentaCodigo',
  'TransporteCodigo',
  'CanalCodigo',
  'GrupoCodigo',
  'ZonaCodigo',
  'TipoDocumento',
  'CodigoLocalidad',
  'GrupoPercepcionIIBBCodigo'
];

const CAMPOS_FECHA = ['FechaDeAlta', 'FechaDeBaja'];

const ETIQUETAS_CAMPO = {
  Codigo: 'código',
  Descripcion: 'razón social',
  NombreFantasia: 'nombre de fantasía',
  CategoriaIva: 'categoría IVA',
  ListaPrecio: 'lista de precio',
  Cuit: 'CUIT',
  Calle: 'calle',
  Numero: 'número',
  ProvinciaCodigo: 'provincia',
  CodigoPostal: 'localidad',
  CodigoLocalidad: 'localidad',
  Localidad: 'localidad',
  CodigoVendedor: 'vendedor',
  FechaDeAlta: 'fecha de alta',
  FechaDeBaja: 'fecha de baja',
  CanalCodigo: 'canal',
  TransporteCodigo: 'transporte',
  CondicionVentaCodigo: 'condición de venta',
  GrupoCodigo: 'grupo',
  ZonaCodigo: 'zona',
  TipoDocumento: 'tipo de documento',
  GrupoPercepcionIIBBCodigo: 'grupo de percepción IIBB',
  DirEntregaProvinciaCodigo: 'provincia de entrega',
  DirEntregaLocalidadCodigo: 'localidad de entrega',
  Mail: 'email',
  Telefono: 'teléfono',
  PRIMARY: 'código'
};

const TABLAS_FK = {
  t_vendedores: 'vendedor',
  t_codigospostales: 'localidad',
  t_categoriasiva: 'categoría IVA',
  t_canales: 'canal',
  t_transportes: 'transporte',
  t_condicionesventa: 'condición de venta',
  t_grupos: 'grupo',
  t_zonas: 'zona',
  t_provincias: 'provincia'
};

function etiquetaCampo(campo) {
  if (!campo) return null;
  return ETIQUETAS_CAMPO[campo] || campo;
}

function fechaMysqlValida(valor) {
  if (valor == null || valor === '') return null;
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
  }
  const texto = String(valor).trim();
  if (!texto || /^invalid date$/i.test(texto)) return null;
  const match = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return match[1];
}

function prepararDatosCliente(data) {
  const clienteData = { ...data };
  for (const campo of CAMPOS_VACIOS_A_NULL) {
    if (clienteData[campo] === '') {
      clienteData[campo] = null;
    }
  }
  for (const campo of CAMPOS_FECHA) {
    if (Object.prototype.hasOwnProperty.call(clienteData, campo)) {
      clienteData[campo] = fechaMysqlValida(clienteData[campo]);
    }
  }
  return clienteData;
}

function sqlMessageDe(error) {
  return error.parent?.sqlMessage || error.original?.sqlMessage || error.sqlMessage || '';
}

function camposDe(error) {
  if (Array.isArray(error.fields) && error.fields.length) {
    return error.fields.filter(Boolean);
  }
  if (error.fields && typeof error.fields === 'object') {
    return Object.keys(error.fields);
  }
  return [];
}

function extraerColumna(sqlMessage) {
  return (
    sqlMessage.match(/column ['`]([^'`]+)['`]/i)?.[1] ||
    sqlMessage.match(/FOREIGN KEY \([`'"]([^`'"]+)[`'"]\)/i)?.[1] ||
    sqlMessage.match(/for key ['`]([^'`]+)['`]/i)?.[1] ||
    null
  );
}

function extraerTablaReferenciada(sqlMessage) {
  return sqlMessage.match(/REFERENCES [`'"]([^`'"]+)[`'"]/i)?.[1] || null;
}

function extraerValorDuplicado(sqlMessage) {
  return sqlMessage.match(/Duplicate entry '([^']*)'/i)?.[1] || null;
}

function extraerValorIncorrecto(sqlMessage) {
  return sqlMessage.match(/Incorrect .+ value: '([^']*)'/i)?.[1] || null;
}

function describirErrorCliente(error, accion = 'guardar') {
  const sqlMessage = sqlMessageDe(error) || error.message || '';
  const campos = camposDe(error);
  const columna =
    campos[0] ||
    extraerColumna(sqlMessage) ||
    error.parent?.sqlMessage?.match(/column ['`]([^'`]+)['`]/i)?.[1] ||
    null;
  const etiqueta = etiquetaCampo(columna);

  if (error.name === 'SequelizeForeignKeyConstraintError' || /foreign key constraint/i.test(sqlMessage)) {
    const tabla = extraerTablaReferenciada(sqlMessage) || error.table;
    const nombreRelacion = TABLAS_FK[tabla] || etiqueta || 'un dato relacionado';
    return {
      status: 400,
      message: `El valor de ${nombreRelacion} no existe en el sistema. Revisá esa selección.`,
      campo: columna,
      detalle: sqlMessage
    };
  }

  if (error.name === 'SequelizeUniqueConstraintError' || /Duplicate entry/i.test(sqlMessage)) {
    const valor = extraerValorDuplicado(sqlMessage);
    if (columna === 'PRIMARY' || columna === 'Codigo') {
      return {
        status: 409,
        message: valor
          ? `Ya existe un cliente con el código ${valor}.`
          : 'Ya existe un cliente con ese código.',
        campo: 'Codigo',
        detalle: sqlMessage
      };
    }
    if (columna === 'Cuit') {
      return {
        status: 409,
        message: valor
          ? `Ya existe un cliente con el CUIT ${valor}.`
          : 'Ya existe un cliente con ese CUIT.',
        campo: 'Cuit',
        detalle: sqlMessage
      };
    }
    return {
      status: 409,
      message: etiqueta
        ? `Ya existe un cliente con ese valor de ${etiqueta}.`
        : 'Ya existe un cliente con esos datos.',
      campo: columna === 'PRIMARY' ? 'Codigo' : columna,
      detalle: sqlMessage
    };
  }

  if (error.name === 'SequelizeValidationError') {
    const first = error.errors?.[0];
    const campoValidacion = first?.path;
    return {
      status: 400,
      message: first?.message
        || (campoValidacion
          ? `El campo ${etiquetaCampo(campoValidacion)} no es válido.`
          : 'Los datos del cliente no son válidos.'),
      campo: campoValidacion,
      detalle: sqlMessage
    };
  }

  if (/cannot be null/i.test(sqlMessage)) {
    const campoNulo = extraerColumna(sqlMessage) || columna;
    return {
      status: 400,
      message: campoNulo
        ? `Falta completar ${etiquetaCampo(campoNulo)}.`
        : 'Falta un dato obligatorio.',
      campo: campoNulo,
      detalle: sqlMessage
    };
  }

  if (/Data too long/i.test(sqlMessage) || error.parent?.code === 'ER_DATA_TOO_LONG') {
    return {
      status: 400,
      message: etiqueta
        ? `El valor de ${etiqueta} es demasiado largo.`
        : 'Hay un valor demasiado largo.',
      campo: columna,
      detalle: sqlMessage
    };
  }

  if (error.name === 'SequelizeDatabaseError') {
    if (/Incorrect date value/i.test(sqlMessage)) {
      return {
        status: 400,
        message:
          columna === 'FechaDeBaja'
            ? 'La fecha de baja no es válida. Si el cliente sigue activo, dejala vacía.'
            : `La ${etiqueta || 'fecha'} no es válida.`,
        campo: columna,
        detalle: sqlMessage
      };
    }
    if (/Incorrect .+ value|ER_TRUNCATED_WRONG_VALUE|ER_TRUNCATED_WRONG_VALUE_FOR_FIELD/i.test(sqlMessage)
      || error.parent?.code === 'ER_TRUNCATED_WRONG_VALUE'
      || error.parent?.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      const valor = extraerValorIncorrecto(sqlMessage);
      return {
        status: 400,
        message: etiqueta
          ? `El valor de ${etiqueta}${valor ? ` (“${valor}”)` : ''} no es válido.`
          : 'Hay un valor con formato incorrecto.',
        campo: columna,
        detalle: sqlMessage
      };
    }
    return {
      status: 500,
      message: etiqueta
        ? `No se pudo ${accion} el cliente: problema en ${etiqueta}.`
        : `No se pudo ${accion} el cliente.`,
      campo: columna,
      detalle: sqlMessage || error.message
    };
  }

  return {
    status: 500,
    message: `No se pudo ${accion} el cliente.`,
    campo: columna,
    detalle: sqlMessage || error.message
  };
}

module.exports = {
  fechaMysqlValida,
  prepararDatosCliente,
  describirErrorCliente,
  etiquetaCampo
};
