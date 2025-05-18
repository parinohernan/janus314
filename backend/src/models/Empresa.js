const { Model, DataTypes } = require('sequelize');
const masterDB = require('../config/masterDB');

class Empresa extends Model {}

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