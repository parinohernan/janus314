const { Sequelize } = require('sequelize');
const initializeModels = require('../utils/modelInitializer');
const Cliente = require('../models/cliente.model');

describe('Atributos de Cliente para persistencia al editar', () => {
  const camposComerciales = [
    'PorcentajeBonificacionGeneral',
    'CondicionVentaCodigo',
    'FechaDeAlta',
    'FechaDeBaja',
    'CanalCodigo'
  ];

  let models;

  beforeAll(() => {
    const sequelize = new Sequelize({
      dialect: 'mysql',
      host: '127.0.0.1',
      username: 'test',
      password: 'test',
      database: 'test',
      logging: false
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    models = initializeModels(sequelize);
    log.mockRestore();
  });

  it('el modelo de tenant incluye la bonificación general y el resto de columnas comerciales de t_clientes', () => {
    for (const campo of camposComerciales) {
      expect(models.Cliente.rawAttributes).toHaveProperty(campo);
    }
  });

  it('al setear PorcentajeBonificacionGeneral Sequelize lo marca como cambiado para el UPDATE', () => {
    const cliente = models.Cliente.build(
      { Codigo: '1113', Descripcion: 'Cliente prueba', PorcentajeBonificacionGeneral: 0 },
      { isNewRecord: false }
    );
    cliente.set({ PorcentajeBonificacionGeneral: 12.5, Descripcion: 'Cliente prueba' });

    expect(cliente.changed()).toEqual(expect.arrayContaining(['PorcentajeBonificacionGeneral']));
    expect(cliente.get('PorcentajeBonificacionGeneral')).toBe(12.5);
  });

  it('getAttributes del modelo Cliente incluye PorcentajeBonificacionGeneral', () => {
    const attrs = Cliente.getAttributes();
    expect(attrs).toHaveProperty('PorcentajeBonificacionGeneral');
  });

  it('getAllClientes incluye PorcentajeBonificacionGeneral para el autocomplete de facturas', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.join(__dirname, '../controllers/cliente.controller.js'),
      'utf8'
    );
    const bloqueAtributos = src.slice(
      src.indexOf('attributes: ['),
      src.indexOf('await enriquecerLocalidadEnClientes')
    );
    expect(bloqueAtributos).toContain('PorcentajeBonificacionGeneral');
  });
});
