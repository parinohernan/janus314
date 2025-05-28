const { Model, DataTypes } = require("sequelize");

class CajaCabeza extends Model {
  static getAttributes() {
    return {
      Codigo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Descripcion: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      VendedorId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: 't_vendedores',
          key: 'Codigo'
        }
      },
      SaldoInicial: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false,
        defaultValue: 0
      },
      SaldoCierre: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: true
      },
      SaldoTeorico: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: true
      },
      Apertura: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      Cierre: {
        type: DataTypes.DATE,
        allowNull: true
      },
      Estado: {
        type: DataTypes.ENUM('abierta', 'cerrada', 'en_arqueo'),
        defaultValue: 'abierta'
      },
      Observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    };
  }
}

module.exports = CajaCabeza; 