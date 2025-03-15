const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

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

// Crear app Express
const app = express();

// Middleware
app.use(helmet()); // Seguridad HTTP
app.use(cors()); // Habilitar CORS
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
app.use("/api/stockmovimientos", (req, res) => {
  res.json({ message: "API de Gestión Comercial funcionando correctamente" });
});

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
  console.error(err.stack);
  res.status(500).json({
    message: "Error del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;
