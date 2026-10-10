const axios = require("axios");

const TIMEOUT_MS = 15000;
const RUTA_ADMIN = "/api/admin/empresa";
const PASSWORD_ENMASCARADA = "********";

// Campos de texto que la instancia atrarca acepta en PUT /api/admin/empresa.
const CAMPOS_CONFIGURACION = [
  "cuit",
  "razonSocial",
  "dbType",
  "dbHost",
  "dbPort",
  "dbUser",
  "dbPassword",
  "dbName",
  "afipMode"
];

/**
 * Origen (protocolo + host) del endpoint de ARCA de la empresa.
 * Se toma solo el origin: el valor por defecto trae path (/api/astrial) y concatenar
 * /api/admin/... sobre eso produciría una URL inválida.
 */
function origenDe(empresa) {
  const crudo = String(empresa?.arcaendpoint || "").trim();
  if (!crudo) return null;
  const conProtocolo = /^https?:\/\//i.test(crudo) ? crudo : `http://${crudo}`;
  try {
    return new URL(conProtocolo).origin;
  } catch (error) {
    return null;
  }
}

function claveDe(empresa) {
  return String(empresa?.arca_admin_key || "").trim();
}

/** Responde 400 si la empresa no tiene un arcaendpoint usable. Devuelve el origin o null. */
function exigirEndpoint(req, res) {
  const origen = origenDe(req.empresaData);
  if (origen) return origen;
  res.status(400).json({
    success: false,
    error: "La empresa no tiene configurado un endpoint de ARCA válido (arcaendpoint)."
  });
  return null;
}

/**
 * Responde 503 si la instancia no tiene guardada la clave de administración.
 * La clave nunca se devuelve al navegador, solo se usa como header x-admin-key.
 */
function exigirClave(req, res) {
  const clave = claveDe(req.empresaData);
  if (clave) return clave;
  res.status(503).json({
    success: false,
    error:
      "Todavía no se guardó la clave de administración de atrarca. Ingrese la clave en el formulario y guarde la configuración.",
    adminKeyConfigurado: false,
    arcaendpoint: req.empresaData?.arcaendpoint || null
  });
  return null;
}

/**
 * Persiste la clave de administración recibida en el multipart (campo arcaAdminKey).
 * Solo se escribe si viene un valor no vacío: un campo vacío no borra la clave guardada.
 */
async function guardarClaveRecibida(req) {
  const recibida =
    typeof req.body?.arcaAdminKey === "string" ? req.body.arcaAdminKey.trim() : "";
  if (!recibida) return true;
  try {
    await req.empresaData.update({ arca_admin_key: recibida });
    return true;
  } catch (error) {
    console.error("Error al guardar arca_admin_key:", error);
    return false;
  }
}

async function llamarAtrarca({ url, method, data, clave }) {
  const respuesta = await axios.request({
    url,
    method,
    data,
    headers: { "x-admin-key": clave },
    timeout: TIMEOUT_MS,
    validateStatus: () => true
  });
  return {
    status: respuesta.status,
    data:
      respuesta.data && typeof respuesta.data === "object" ? respuesta.data : {}
  };
}

function responderConFallo(res, error) {
  const detalle =
    error.code === "ECONNABORTED"
      ? "Se agotó el tiempo de espera de 15 s."
      : error.code
        ? `No se pudo conectar (${error.code}).`
        : "";
  console.error("Error al contactar la instancia de atrarca:", error.message);
  return res.status(502).json({
    success: false,
    error: `No se pudo contactar a la instancia de atrarca. ${detalle}`.trim()
  });
}

/** Valores que el ERP conoce y que se usan para prellenar el formulario. */
async function datosDePrefill(req) {
  const empresa = req.empresaData || {};
  let datos = null;
  try {
    if (req.models?.DatosEmpresa) {
      datos = await req.models.DatosEmpresa.findOne();
    }
  } catch (error) {
    console.warn("No se pudieron leer datos de la empresa para prellenar:", error.message);
  }

  const cuit = String(datos?.Cuit || "").replace(/\D/g, "");
  return {
    cuit: cuit.length === 11 ? cuit : "",
    razonSocial: String(datos?.RazonSocial || ""),
    dbHost: String(empresa.db_host || ""),
    dbPort: empresa.db_port ? String(empresa.db_port) : "",
    dbUser: String(empresa.db_user || ""),
    dbName: String(empresa.db_name || "")
  };
}

function adjuntarArchivo(form, campo, files) {
  const archivo = files?.[campo]?.[0];
  if (!archivo || !archivo.buffer) return;
  form.append(
    campo,
    new Blob([archivo.buffer], { type: archivo.mimetype || "application/octet-stream" }),
    archivo.originalname || campo
  );
}

/** GET /api/afip/admin-empresa */
exports.obtener = async (req, res) => {
  const origen = exigirEndpoint(req, res);
  if (!origen) return;
  const clave = exigirClave(req, res);
  if (!clave) return;

  try {
    const { status, data } = await llamarAtrarca({
      url: `${origen}${RUTA_ADMIN}`,
      method: "GET",
      clave
    });
    if (status >= 400) return res.status(status).json(data);

    const prefill = await datosDePrefill(req);
    const empresaAtrarca =
      data.empresa && typeof data.empresa === "object" ? data.empresa : {};
    const empresa = { ...empresaAtrarca };
    Object.entries(prefill).forEach(([campo, valor]) => {
      if (valor) empresa[campo] = valor;
    });
    if (!empresa.dbType) empresa.dbType = "mysql";
    if (!empresa.afipMode) empresa.afipMode = "production";

    // La contraseña de la base jamás viaja al navegador.
    delete empresa.dbPassword;

    return res.json({
      success: data.success !== false,
      instancia: data.instancia ?? null,
      empresa,
      certificado: data.certificado ?? null,
      arcaendpoint: req.empresaData?.arcaendpoint || null,
      adminKeyConfigurado: true
    });
  } catch (error) {
    return responderConFallo(res, error);
  }
};

/** PUT /api/afip/admin-empresa (multipart) */
exports.actualizar = async (req, res) => {
  if (!(await guardarClaveRecibida(req))) {
    return res.status(500).json({
      success: false,
      error: "No se pudo guardar la clave de administración de atrarca."
    });
  }
  const origen = exigirEndpoint(req, res);
  if (!origen) return;
  const clave = exigirClave(req, res);
  if (!clave) return;

  try {
    const form = new FormData();
    for (const campo of CAMPOS_CONFIGURACION) {
      const valor = req.body?.[campo];
      if (valor === undefined || valor === null) continue;
      const texto = String(valor).trim();
      if (!texto || texto === PASSWORD_ENMASCARADA) continue;
      form.append(campo, texto);
    }
    // Si el navegador no mandó contraseña, se reenvía la que tiene guardada la empresa.
    if (!form.has("dbPassword")) {
      const almacenada = String(req.empresaData?.db_password || "");
      if (almacenada) form.append("dbPassword", almacenada);
    }
    adjuntarArchivo(form, "certificado", req.files);
    adjuntarArchivo(form, "key", req.files);

    const { status, data } = await llamarAtrarca({
      url: `${origen}${RUTA_ADMIN}`,
      method: "PUT",
      data: form,
      clave
    });
    return res.status(status).json(data);
  } catch (error) {
    return responderConFallo(res, error);
  }
};

/** POST /api/afip/admin-empresa/certificado (multipart, solo archivos) */
exports.renovarCertificado = async (req, res) => {
  if (!(await guardarClaveRecibida(req))) {
    return res.status(500).json({
      success: false,
      error: "No se pudo guardar la clave de administración de atrarca."
    });
  }
  const origen = exigirEndpoint(req, res);
  if (!origen) return;
  const clave = exigirClave(req, res);
  if (!clave) return;

  try {
    const form = new FormData();
    adjuntarArchivo(form, "certificado", req.files);
    adjuntarArchivo(form, "key", req.files);

    const { status, data } = await llamarAtrarca({
      url: `${origen}${RUTA_ADMIN}/certificado`,
      method: "POST",
      data: form,
      clave
    });
    return res.status(status).json(data);
  } catch (error) {
    return responderConFallo(res, error);
  }
};

/** POST /api/afip/admin-empresa/verificar */
exports.verificar = async (req, res) => {
  const origen = exigirEndpoint(req, res);
  if (!origen) return;
  const clave = exigirClave(req, res);
  if (!clave) return;

  try {
    const { status, data } = await llamarAtrarca({
      url: `${origen}${RUTA_ADMIN}/verificar`,
      method: "POST",
      clave
    });
    return res.status(status).json(data);
  } catch (error) {
    return responderConFallo(res, error);
  }
};
