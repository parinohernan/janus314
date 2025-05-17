const { Model, DataTypes } = require('sequelize');
const masterDB = require('../config/masterDB');
const bcrypt = require('bcrypt');

class Usuario extends Model {
  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

Usuario.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('admin', 'usuario'),
    allowNull: false,
    defaultValue: 'usuario'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ultimoAcceso: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize: masterDB.getConnection(),
  modelName: 'Usuario',
  tableName: 'usuarios',
  timestamps: true,
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await Usuario.hashPassword(usuario.password);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await Usuario.hashPassword(usuario.password);
      }
    }
  }
});

module.exports = Usuario; 