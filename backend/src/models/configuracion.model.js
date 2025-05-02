const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Configuracion = sequelize.define('Configuracion', {
  Codigo: {
    type: DataTypes.STRING(200),
    primaryKey: true,
    allowNull: false
  },
  Descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  ValorConfig: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pasar_a_ipaqs: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 't_configuracion'
});

// Métodos estáticos
Configuracion.buscarPorCodigo = async function(codigo) {
  return await this.findOne({
    where: { Codigo: codigo }
  });
};

Configuracion.actualizar = async function(codigo, valor) {
  const [config, created] = await this.findOrCreate({
    where: { Codigo: codigo },
    defaults: {
      Descripcion: this.getDescripcionPorCodigo(codigo),
      ValorConfig: valor,
      pasar_a_ipaqs: true
    }
  });

  if (!created) {
    await config.update({
      ValorConfig: valor
    });
  }

  return config;
};

// Método auxiliar para obtener la descripción según el código
Configuracion.getDescripcionPorCodigo = function(codigo) {
  const descripciones = {
    'PreventasServidor': 'Servidor de Preventas',
    'PreventasBaseDeDatos': 'Base de Datos de Preventas',
    'PreventaUsuario': 'Usuario de Preventas',
    'PreventaContraseña': 'Contraseña de Preventas',
    'PreventaUltimaDescarga': 'Última fecha de descarga',
    'PreventaUltimaActualizacion': 'Última fecha de actualización'
  };
  return descripciones[codigo] || '';
};

module.exports = Configuracion;
