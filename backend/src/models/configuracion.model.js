const db = require("../config/database");

/**
 * Modelo para la tabla t_configuracion
 */
class Configuracion {
  /**
   * Obtiene una configuración por su código
   * @param {string} codigo - El código de la configuración
   * @returns {Promise<Object|null>} - La configuración encontrada o null
   */
  static async buscarPorCodigo(codigo) {
    try {
      return await db.query(
        "SELECT * FROM t_configuracion WHERE Codigo = :codigo",
        {
          replacements: { codigo: codigo },
          type: db.QueryTypes.SELECT,
          plain: true,
        }
      );
    } catch (error) {
      console.error("Error en el modelo Configuracion.buscarPorCodigo:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las configuraciones
   * @returns {Promise<Array>} - Lista de configuraciones
   */
  static async obtenerTodos() {
    try {
      const [rows] = await db.query("SELECT * FROM t_configuracion");
      return rows;
    } catch (error) {
      console.error("Error en el modelo Configuracion.obtenerTodos:", error);
      throw error;
    }
  }

  /**
   * Actualiza el valor de una configuración
   * @param {string} codigo - El código de la configuración
   * @param {string} valor - El nuevo valor
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async actualizar(codigo, valor) {
    try {
      const [result] = await db.query(
        "UPDATE t_configuracion SET ValorConfig = ? WHERE Codigo = ?",
        [valor, codigo]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en el modelo Configuracion.actualizar:", error);
      throw error;
    }
  }
}

module.exports = Configuracion;
