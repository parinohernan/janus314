/**
 * Crea un modelo propio de una conexión a partir de una clase base de modelo.
 *
 * Llamar `Base.init({ sequelize })` sobre la clase compartida la re-enlaza a la
 * última empresa conectada, y con varias empresas activas las consultas terminan
 * en la base equivocada. Cada conexión necesita su propia subclase.
 */
function modeloPorConexion(Base, sequelize, options = {}) {
  const Modelo = class extends Base {};
  Object.defineProperty(Modelo, 'name', { value: Base.name });
  Modelo.init(Base.getAttributes(), {
    modelName: Base.name,
    ...options,
    sequelize,
  });
  return Modelo;
}

module.exports = { modeloPorConexion };
