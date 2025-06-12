const fetch = require("node-fetch");

function buildArcaUrl(baseUrl, path) {
  // Eliminar barras al final de la URL base y al inicio del path
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBaseUrl}/${cleanPath}`;
}

exports.obtenerCae = async (req, res) => {
  console.log("**********Solicitando CAE...BACKEND", req.body);
  try {
    const { tipo, puntoVenta, numero, solicitarCAE } = req.body;

    // Validar datos de entrada
    if (!tipo || !puntoVenta || !numero) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios para solicitar CAE",
      });
    }

    // Obtener el endpoint de ARCA de la empresa actual
    const empresa = req.empresaData;
    if (!empresa || !empresa.arcaendpoint) {
      return res.status(400).json({
        success: false,
        message: "No se encontró la configuración del endpoint de ARCA para esta empresa," + empresa?.arcaendpoint,
      });
    }

    const arcaUrl = buildArcaUrl(empresa.arcaendpoint, 'api/astrial/grabar-cae');
    console.log("**********endpoint:", arcaUrl);

    // Llamar al servicio externo de AFIP/ARCA usando el endpoint configurado
    const response = await fetch(arcaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "", // Pasar el token si es necesario
      },
      body: JSON.stringify({
        tipo,
        puntoVenta,
        numero,
        solicitarCAE,
      }),
    });

    // Procesar respuesta
    const data = await response.json();
    console.log("Respuesta del servicio AFIP/ARCA:", data);

    // Devolver respuesta al cliente
    return res.status(response.ok ? 200 : 400).json(data);
  } catch (error) {
    console.error("Error al obtener CAE:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar solicitud de CAE",
      error: error.message,
    });
  }
};

exports.obtenerEstadoCompleto = async (req, res) => {
  try {
    const empresa = req.empresaData;
    if (!empresa || !empresa.arcaendpoint) {
      return res.status(400).json({
        success: false,
        message: "No se encontró la configuración del endpoint de ARCA para esta empresa",
      });
    }

    // Obtener estado del servidor
    const estadoUrl = buildArcaUrl(empresa.arcaendpoint, 'api/astrial/estado-servidor');
    console.log("**********endpoint estado:", estadoUrl);
    
    const estadoResponse = await fetch(estadoUrl);
    const estadoData = await estadoResponse.json();

    // Obtener últimos comprobantes para cada tipo
    const tiposComprobantes = [
      { tipo: 'FCA', descripcion: 'Factura A' },
      { tipo: 'FCB', descripcion: 'Factura B' },
      { tipo: 'FCC', descripcion: 'Factura C' },
      { tipo: 'NCA', descripcion: 'Nota de Crédito A' },
      { tipo: 'NCB', descripcion: 'Nota de Crédito B' },
      { tipo: 'NCC', descripcion: 'Nota de Crédito C' }
    ];

    const ultimosComprobantes = await Promise.all(
      tiposComprobantes.map(async (tipo) => {
        try {
          const comprobanteUrl = buildArcaUrl(empresa.arcaendpoint, 'api/astrial/ultimo-comprobante');
          const response = await fetch(comprobanteUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization || "",
            },
            body: JSON.stringify({
              tipo: tipo.tipo,
              puntoVenta: "0001" // TODO: Obtener de la configuración de la empresa
            }),
          });

          if (!response.ok) {
            return {
              tipo: tipo.tipo,
              descripcion: tipo.descripcion,
              ultimoNumero: "Error",
              puntoVenta: "0001"
            };
          }

          const data = await response.json();
          return {
            tipo: tipo.tipo,
            descripcion: tipo.descripcion,
            ultimoNumero: data.ultimoNumero || "0",
            puntoVenta: "0001"
          };
        } catch (error) {
          console.error(`Error al obtener último comprobante para ${tipo.tipo}:`, error);
          return {
            tipo: tipo.tipo,
            descripcion: tipo.descripcion,
            ultimoNumero: "Error",
            puntoVenta: "0001"
          };
        }
      })
    );

    res.json({
      disponible: estadoResponse.ok,
      mensaje: estadoData.mensaje || "Servidor ARCA funcionando correctamente",
      ultimosComprobantes
    });
  } catch (error) {
    console.error("Error al obtener estado completo de ARCA:", error);
    res.status(500).json({
      disponible: false,
      mensaje: "Error al conectar con el servidor de ARCA",
      ultimosComprobantes: []
    });
  }
};

exports.obtenerUltimoComprobante = async (req, res) => {
  try {
    const { tipo, puntoVenta } = req.body;

    if (!tipo || !puntoVenta) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios",
      });
    }

    const empresa = req.empresaData;
    if (!empresa || !empresa.arcaendpoint) {
      return res.status(400).json({
        success: false,
        message: "No se encontró la configuración del endpoint de ARCA para esta empresa",
      });
    }

    const comprobanteUrl = buildArcaUrl(empresa.arcaendpoint, 'api/astrial/ultimo-comprobante');
    const response = await fetch(comprobanteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      },
      body: JSON.stringify({ tipo, puntoVenta }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error al obtener último comprobante:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener último comprobante",
      error: error.message,
    });
  }
};
