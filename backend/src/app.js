const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { requestLogger, logError } = require('./utils/logger');
const getEmpresaConnection = require('./middleware/dbConnection');
require("./config/timezone");

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const authRoutes = require('./routes/auth.routes');
// Comentamos las rutas que aún no existen
const productoRoutes = require("./routes/articulo.routes");
const proveedorRoutes = require("./routes/proveedor.routes");
const rubroRoutes = require("./routes/rubro.routes");
const provinciaRoutes = require("./routes/provincia.routes");
const localidadRoutes = require("./routes/localidad.routes");
const clienteRoutes = require("./routes/cliente.routes");
const categoriaIvaRoutes = require("./routes/categoriaIva.routes");
const movimientoStockRoutes = require("./routes/movimientoStock.routes");
const numerosControlRoutes = require("./routes/numerosControl.routes");
const datosEmpresaRoutes = require("./routes/datosEmpresa.routes");
const facturaRoutes = require("./routes/factura.routes");
const vendedorRoutes = require("./routes/vendedor.routes");
const usuarioRoutes = require("./routes/usuario.routes");
const tipoDePagoRoutes = require("./routes/tipoDePago.routes");
const afipRoutes = require("./routes/arca.routes");
const pedidoRoutes = require("./routes/pedido.routes");
const preventaRoutes = require("./routes/preventa.routes");
const configRoutes = require("./routes/config.routes");
const notaCreditoRoutes = require("./routes/notaCredito.routes");
const notaDebitoRoutes = require("./routes/notaDebito.routes");
const reciboRoutes = require("./routes/recibo.routes");
const informesRoutes = require("./routes/informes.routes");
const configuracionRoutes = require('./routes/configuracion.routes');
const sincronizacionRoutes = require('./routes/sincronizacion.routes');
const reciboController = require('./controllers/recibo.controller');
const telegramRoutes = require('./routes/telegram.routes');
const telegramController = require('./controllers/telegram.controller');
const solicitudRoutes = require('./routes/solicitud.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');

// Crear app Express
const app = express();

// Middleware de logging
app.use(requestLogger);

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://janus314.osvi.lat', 
    'https://janus314-api.osvi.lat',
    'https://web.telegram.org'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Seguridad HTTP con configuración para recursos externos
app.use(cors(corsOptions)); // Habilitar CORS con opciones específicas
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
// app.use("/api/productos", productoRoutes);
app.use("/api/articulos", getEmpresaConnection, productoRoutes);
app.use("/api/proveedores", getEmpresaConnection, proveedorRoutes);
app.use("/api/rubros", getEmpresaConnection, rubroRoutes);
app.use("/api/provincias", getEmpresaConnection, provinciaRoutes);
app.use("/api/localidades", getEmpresaConnection, localidadRoutes);
app.use("/api/clientes", getEmpresaConnection, clienteRoutes);
app.use("/api/categorias-iva", getEmpresaConnection, categoriaIvaRoutes);
app.use("/api/movimientos-stock", getEmpresaConnection, movimientoStockRoutes);
app.use("/api/numeros-control", getEmpresaConnection, numerosControlRoutes);
app.use("/api/datos-empresa", getEmpresaConnection, datosEmpresaRoutes);
app.use("/api/stockmovimientos", (req, res) => {
  res.json({ message: "API de Gestión Comercial funcionando correctamente" });
});
app.use("/api/facturas", getEmpresaConnection, facturaRoutes);
app.use("/api/vendedores", getEmpresaConnection, vendedorRoutes);
app.use("/api/usuarios", getEmpresaConnection, usuarioRoutes);

// Rutas de tipo de pago
app.use("/api/tipos-pago", getEmpresaConnection, tipoDePagoRoutes);

// Rutas de AFIP ARCA
app.use("/api/afip", getEmpresaConnection, afipRoutes);

// Rutas de pedidos
app.use("/api/pedidos", getEmpresaConnection, pedidoRoutes);

// Rutas de preventas
app.use("/api/preventas", getEmpresaConnection, preventaRoutes);

// Rutas de sincronización (MOVIDA ANTES DE /api)
app.use('/api/sincronizacion', getEmpresaConnection, sincronizacionRoutes);

// Rutas de configuración 
app.use('/api/config', getEmpresaConnection, configRoutes);

// Rutas de informes
app.use("/api/informes", getEmpresaConnection, informesRoutes);

// Rutas de recibos
app.use("/api/recibos", getEmpresaConnection, reciboRoutes);

// Rutas de Telegram
app.use('/api/telegram', telegramRoutes);

// Rutas de solicitudes
app.use('/api/solicitudes', solicitudRoutes);

// Rutas de administración y monitoreo
app.use('/api/admin', adminRoutes);
app.use('/health', healthRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API de Gestión Comercial funcionando correctamente" });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    message: "Sección en construcción",
    description: "El recurso solicitado no existe o está en desarrollo.",
  });
});

// Middleware de errores
app.use((err, req, res, next) => {
  logError(err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar el bot de Telegram después de iniciar el servidor
telegramController.initBot();

module.exports = app;
