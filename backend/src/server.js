const app = require("./app");
const db = require("./config/database");
// Importar el archivo de asociaciones para definir las relaciones entre modelos
require("./models/associations");

// Puerto
const PORT = process.env.PORT || 3330;

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);

  try {
    // Verificar conexión a la base de datos
    await db.authenticate();
    console.log("Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
});
