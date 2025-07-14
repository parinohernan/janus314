const { Model, DataTypes } = require("sequelize");

class CajaMovimientos extends Model {
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
      Tipo: {
        type: DataTypes.ENUM('ingreso', 'egreso'),
        allowNull: false
      },
      Importe: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      Concepto: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      MetodoPago: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 't_tiposdepago',
          key: 'Codigo'
        }
      },
      Referencia: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      Banco: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      ValorFecha: {
        type: DataTypes.DATE,
        allowNull: true
      },
      DocumentoAsociado: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      TipoDocumento: {
        type: DataTypes.STRING(3),
        allowNull: true,
        comment: 'Tipo de documento (PRF, FCA, FCB, REC, NCA, NCB, etc)'
      },
      FechaHora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      UsuarioId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 't_vendedores',
          key: 'Codigo'
        }
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

module.exports = CajaMovimientos; 