const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

// Importar rutas
// Comentamos las rutas que aún no existen
const productoRoutes = require("./routes/producto.routes");
const proveedorRoutes = require("./routes/proveedor.routes");
const rubroRoutes = require("./routes/rubro.routes");

// Crear app Express
const app = express();

// Middleware
app.use(helmet()); // Seguridad HTTP
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true }));

// Rutas
// app.use("/api/productos", productoRoutes);
// app.use("/api/proveedores", proveedorRoutes);
app.use("/api/rubros", rubroRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API de Gestión Comercial funcionando correctamente" });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
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
