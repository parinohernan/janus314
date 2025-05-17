const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { requestLogger, logError } = require('./utils/logger');
require("./config/timezone");

// Cargar variables de entorno
dotenv.config();

// Importar rutas
// Comentamos las rutas que aún no existen
const productoRoutes = require("./routes/articulo.routes");
const proveedorRoutes = require("./routes/proveedor.routes");
const rubroRoutes = require("./routes/rubro.routes");
const provinciaRoutes = require("./routes/provincia.routes");
const localidadRoutes = require("./routes/codigoPostal.routes");
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
// app.use("/api/productos", productoRoutes);
app.use("/api/articulos", productoRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/rubros", rubroRoutes);
app.use("/api/provincias", provinciaRoutes);
app.use("/api/localidades", localidadRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/categoriasiva", categoriaIvaRoutes);
app.use("/api/movimientos-stock", movimientoStockRoutes);
app.use("/api/numeros-control", numerosControlRoutes);
app.use("/api/datos-empresa", datosEmpresaRoutes);
app.use("/api/stockmovimientos", (req, res) => {
  res.json({ message: "API de Gestión Comercial funcionando correctamente" });
});
app.use("/api/facturas", facturaRoutes);
app.use("/api/vendedores", vendedorRoutes);
app.use("/api/usuarios", usuarioRoutes);

// Rutas de tipo de pago
app.use("/api/tipos-de-pago", tipoDePagoRoutes);

// Rutas de AFIP ARCA
app.use("/api/arca", afipRoutes);

// Rutas de pedidos
app.use("/api/pedidos", pedidoRoutes);

// Rutas de preventas
app.use("/api/preventas", preventaRoutes);

// Rutas de sincronización (MOVIDA ANTES DE /api)
app.use('/api/sincronizacion', sincronizacionRoutes);

// Rutas de configuración 
app.use('/api', configuracionRoutes);

// Rutas de informes
app.use("/api/informes", informesRoutes);

// Rutas de recibos
app.use("/api/recibos", reciboRoutes);

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
  logError(err, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(500).json({
    message: "Error del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Iniciar el bot de Telegram después de iniciar el servidor
telegramController.initBot();

module.exports = app;
