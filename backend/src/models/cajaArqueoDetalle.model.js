const { Model, DataTypes } = require("sequelize");

class CajaArqueoDetalle extends Model {
  static getAttributes() {
    return {
      Codigo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      CajaCabezaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'caja_cabeza_new',
          key: 'Codigo'
        }
      },
      MetodoPago: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 't_tiposdepago',
          key: 'Codigo'
        }
      },
      MontoContado: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      MontoSistema: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      Diferencia: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
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

module.exports = CajaArqueoDetalle; 