'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cuentas_acceso', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      usuario: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      empresa_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'empresas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      vendedor_codigo: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ultimo_acceso: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('cuentas_acceso', ['empresa_id', 'vendedor_codigo'], {
      unique: true,
      name: 'cuentas_acceso_empresa_vendedor_unique'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('cuentas_acceso');
  }
};
