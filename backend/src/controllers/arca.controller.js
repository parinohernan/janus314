const fetch = require("node-fetch");

function buildArcaUrl(baseUrl, path) {
  // Validar que la URL base tenga protocolo HTTP o HTTPS
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    // Si no tiene protocolo, asumir HTTP
    baseUrl = `http://${baseUrl}`;
  }
  
  // Eliminar barras al final de la URL base y al inicio del path
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const finalUrl = `${cleanBaseUrl}/${cleanPath}`;
  
  console.log('🔗 Construyendo URL ARCA:', { baseUrl, path, finalUrl });
  return finalUrl;
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

    // Obtener punto de venta de la query string
    const puntoVenta = req.query.puntoVenta || empresa.Sucursal || "3";

    // Obtener estado del servidor
    const estadoUrl = buildArcaUrl(empresa.arcaendpoint, 'api/afip/test');
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
          // Mapear el tipo de comprobante a su código numérico
          const tipoComprobanteMap = {
            'FCA': 1,
            'FCB': 6,
            'FCC': 11,
            'NCA': 3,
            'NCB': 8,
            'NCC': 13
          };

          const tipoComprobante = tipoComprobanteMap[tipo.tipo] || 1;
          
          const comprobanteUrl = buildArcaUrl(
            empresa.arcaendpoint, 
            `api/afip/ultimo-comprobante?puntoVenta=${puntoVenta}&tipoComprobante=${tipoComprobante}`
          );

          const response = await fetch(comprobanteUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization || "",
            }
          });

          if (!response.ok) {
            return {
              tipo: tipo.tipo,
              descripcion: tipo.descripcion,
              ultimoComprobante: "Error",
              puntoVenta: puntoVenta.toString().padStart(4, '0')
            };
          }

          const data = await response.json();
          return {
            tipo: tipo.tipo,
            descripcion: tipo.descripcion,
            ultimoComprobante: data.ultimoComprobante || "0",
            puntoVenta: puntoVenta.toString().padStart(4, '0')
          };
        } catch (error) {
          console.error(`Error al obtener último comprobante para ${tipo.tipo}:`, error);
          return {
            tipo: tipo.tipo,
            descripcion: tipo.descripcion,
            ultimoComprobante: "Error",
            puntoVenta: puntoVenta.toString().padStart(4, '0')
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

/**
 * Recupera y actualiza CAE automáticamente
 * Consulta AFIP para obtener el CAE de un comprobante autorizado
 * y lo actualiza en la base de datos
 */
exports.colocarCaeManualmente = async (req, res) => {
  try {
    const { tipo, puntoVenta, numero, cae, fechaVencimiento } = req.body;

    // Validar datos de entrada
    if (!tipo || !puntoVenta || !numero || !cae || !fechaVencimiento) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios: tipo, puntoVenta, numero, cae y fechaVencimiento",
      });
    }

    // Validar formato del CAE (debe ser numérico)
    if (!/^\d+$/.test(cae)) {
      return res.status(400).json({
        success: false,
        message: "El CAE debe ser un número válido",
      });
    }

    // Validar formato de fecha de vencimiento (YYYY-MM-DD)
    const fechaVencimientoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaVencimientoRegex.test(fechaVencimiento)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe tener el formato YYYY-MM-DD",
      });
    }

    console.log(`📝 Colocando CAE manualmente para: ${tipo}-${puntoVenta}-${numero}`);

    // 1. Verificar que el documento existe en la base de datos
    const { FacturaCabeza, Cliente } = req.models;
    
    const documento = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: puntoVenta,
        DocumentoNumero: numero,
      },
      include: [{ model: Cliente }],
      raw: false,
    });

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: "Documento no encontrado en la base de datos"
      });
    }

    // 2. Verificar que el documento no esté anulado
    if (documento.FechaAnulacion) {
      return res.status(400).json({
        success: false,
        message: "No se puede colocar CAE en un documento anulado"
      });
    }

    // 3. Actualizar el CAE en la base de datos
    await FacturaCabeza.update(
      {
        afip_cae: cae,
        afip_cae_vencimiento: fechaVencimiento,
        afip_cae_observaciones: "CAE colocado manualmente por el usuario"
      },
      {
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: puntoVenta,
          DocumentoNumero: numero,
        }
      }
    );

    console.log(`✅ CAE colocado manualmente en BD: ${cae} para ${tipo}-${puntoVenta}-${numero}`);

    // 4. Preparar respuesta exitosa
    const respuesta = {
      success: true,
      mensaje: "CAE colocado manualmente y guardado correctamente en la base de datos",
      documento: {
        tipo: tipo,
        puntoVenta: parseInt(puntoVenta),
        numero: parseInt(numero),
        cliente: documento.Cliente ? documento.Cliente.Descripcion : "Cliente no encontrado",
        fecha: documento.Fecha,
        importeNeto: documento.ImporteNeto || 0,
        importeIva: (documento.ImporteIva1 || 0) + (documento.ImporteIva2 || 0),
        total: documento.ImporteTotal || 0
      },
      cae: {
        numero: cae,
        fechaVencimiento: fechaVencimiento,
        resultado: "A"
      }
    };

    res.json(respuesta);

  } catch (error) {
    console.error("Error al colocar CAE manualmente:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al colocar CAE manualmente",
      error: error.message,
    });
  }
};
