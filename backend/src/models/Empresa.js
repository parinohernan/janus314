const { Model, DataTypes } = require('sequelize');
const masterDB = require('../config/masterDB');

class Empresa extends Model {
  /**
   * arca_admin_key es un secreto (clave x-admin-key de la instancia atrarca):
   * se lee solo del lado del servidor y jamás se expone en una respuesta JSON.
   */
  toJSON() {
    const values = { ...this.dataValues };
    delete values.arca_admin_key;
    return values;
  }
}

const initEmpresa = () => {
  Empresa.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    db_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    db_user: {
      type: DataTypes.STRING,
      allowNull: false
    },
    db_password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    db_host: {
      type: DataTypes.STRING,
      allowNull: false
    },
    db_port: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3306
    },
    arcaendpoint: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'http://localhost:3301/api/astrial'
    },
    arca_admin_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Clave x-admin-key de la instancia atrarca. No se expone en APIs.'
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      defaultValue: 'activo',
      allowNull: false
    }
  }, {
    sequelize: masterDB.getConnection(),
    modelName: 'Empresa',
    tableName: 'empresas',
    timestamps: true,
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  });

  return Empresa;
};

// Inicializar el modelo
const EmpresaModel = initEmpresa();

module.exports = EmpresaModel; 