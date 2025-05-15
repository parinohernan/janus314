const fs = require('fs').promises;
const path = require('path');

// Ruta al archivo de solicitudes
const SOLICITUDES_FILE = path.join(__dirname, '../../data/solicitudes.json');

// Asegurar que el directorio data existe
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, '../../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
}

// Asegurar que el archivo de solicitudes existe
async function ensureSolicitudesFile() {
  try {
    await fs.access(SOLICITUDES_FILE);
  } catch {
    await fs.writeFile(SOLICITUDES_FILE, JSON.stringify([], null, 2));
  }
}

// Leer solicitudes existentes
async function leerSolicitudes() {
  try {
    const data = await fs.readFile(SOLICITUDES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Guardar solicitudes
async function guardarSolicitudes(solicitudes) {
  await fs.writeFile(SOLICITUDES_FILE, JSON.stringify(solicitudes, null, 2));
}

// Controlador para crear una nueva solicitud
exports.crearSolicitud = async (req, res) => {
  try {
    // Asegurar que la estructura de archivos existe
    await ensureDataDirectory();
    await ensureSolicitudesFile();

    // Obtener datos de la solicitud
    const {
      nombre,
      email,
      telefono,
      nombreNegocio,
      tipoNegocio,
      mensaje
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !nombreNegocio || !tipoNegocio) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Crear objeto de solicitud
    const nuevaSolicitud = {
      id: Date.now().toString(),
      nombre,
      email,
      telefono,
      nombreNegocio,
      tipoNegocio,
      mensaje,
      fechaCreacion: new Date().toISOString(),
      estado: 'pendiente'
    };

    // Leer solicitudes existentes
    const solicitudes = await leerSolicitudes();

    // Agregar nueva solicitud
    solicitudes.push(nuevaSolicitud);

    // Guardar solicitudes actualizadas
    await guardarSolicitudes(solicitudes);

    // Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: nuevaSolicitud
    });

  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

// Controlador para obtener todas las solicitudes
exports.obtenerSolicitudes = async (req, res) => {
  try {
    await ensureDataDirectory();
    await ensureSolicitudesFile();

    const solicitudes = await leerSolicitudes();

    res.json({
      success: true,
      data: solicitudes
    });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las solicitudes'
    });
  }
};

// Controlador para obtener una solicitud por ID
exports.obtenerSolicitudPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitudes = await leerSolicitudes();
    const solicitud = solicitudes.find(s => s.id === id);

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });

  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la solicitud'
    });
  }
};

// Controlador para actualizar el estado de una solicitud
exports.actualizarEstadoSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const solicitudes = await leerSolicitudes();
    const index = solicitudes.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    solicitudes[index].estado = estado;
    solicitudes[index].fechaActualizacion = new Date().toISOString();

    await guardarSolicitudes(solicitudes);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: solicitudes[index]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado'
    });
  }
}; 