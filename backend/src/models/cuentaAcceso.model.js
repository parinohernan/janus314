const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const masterDB = require('../config/masterDB');
const Empresa = require('./Empresa');

const BCRYPT_ROUNDS = 12;

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

class CuentaAcceso extends Model {
  static async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async comparePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

CuentaAcceso.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    usuario: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    empresa_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'empresas',
        key: 'id'
      }
    },
    vendedor_codigo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize: masterDB.getConnection(),
    modelName: 'CuentaAcceso',
    tableName: 'cuentas_acceso',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['usuario'] },
      { unique: true, fields: ['empresa_id', 'vendedor_codigo'] }
    ],
    hooks: {
      beforeValidate: (cuenta) => {
        if (cuenta.usuario) {
          cuenta.usuario = String(cuenta.usuario).trim().toLowerCase();
        }
      },
      beforeCreate: async (cuenta) => {
        if (cuenta.password_hash && !isBcryptHash(cuenta.password_hash)) {
          cuenta.password_hash = await CuentaAcceso.hashPassword(cuenta.password_hash);
        }
      },
      beforeUpdate: async (cuenta) => {
        if (cuenta.changed('password_hash') && cuenta.password_hash && !isBcryptHash(cuenta.password_hash)) {
          cuenta.password_hash = await CuentaAcceso.hashPassword(cuenta.password_hash);
        }
      }
    }
  }
);

if (!CuentaAcceso.associations.empresa) {
  CuentaAcceso.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
}
if (!Empresa.associations.cuentasAcceso) {
  Empresa.hasMany(CuentaAcceso, { foreignKey: 'empresa_id', as: 'cuentasAcceso' });
}

module.exports = CuentaAcceso;
module.exports.BCRYPT_ROUNDS = BCRYPT_ROUNDS;
