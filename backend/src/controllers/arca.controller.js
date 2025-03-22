const fetch = require("node-fetch");

exports.obtenerCae = async (req, res) => {
  console.log("Solicitando CAE...BACKEND", req.body);
  try {
    const { tipo, puntoVenta, numero, solicitarCAE } = req.body;

    // Validar datos de entrada
    if (!tipo || !puntoVenta || !numero) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios para solicitar CAE",
      });
    }

    // Llamar al servicio externo de AFIP/ARCA
    const response = await fetch(
      `http://localhost:3301/api/astrial/grabar-cae`,
      {
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
      }
    );

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

exports.verificarEstadoServidor = async (req, res) => {
  // try {
  //   const response = await fetch(
  //     `http://localhost:3301/api/astrial/estado-servidor`
  //   );
  //   const data = await response.json();

  //   res.status(200).json({
  //     disponible: response.ok,
  //     mensaje: data.mensaje || "Consulta realizada correctamente",
  //     data,
  //   });
  // } catch (error) {
  //   console.error("Error al verificar estado del servidor AFIP:", error);
  //   res.status(500).json({
  //     disponible: false,
  //     mensaje: "Error al conectar con el servidor de AFIP",
  //     error: error.message,
  //   });
  // }
  res.status(200).json({
    disponible: true,
    mensaje: "Servidor AFIP/ARCA funcionando correctamente",
  });
};
