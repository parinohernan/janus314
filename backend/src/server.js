const app = require("./app");
const db = require("./config/database");

// Puerto
const PORT = process.env.PORT;

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  try {
    // Verificar conexión a la base de datos
    await db.authenticate();
    console.log("Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
});
