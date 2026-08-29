const {
  fechaMysqlValida,
  prepararDatosCliente,
  describirErrorCliente
} = require('../utils/clientePersistencia.util');

describe('persistencia de fechas de cliente', () => {
  it('convierte vacío e Invalid date a null', () => {
    expect(fechaMysqlValida('')).toBeNull();
    expect(fechaMysqlValida('Invalid date')).toBeNull();
    expect(fechaMysqlValida('invalid date')).toBeNull();
    expect(fechaMysqlValida(new Date('nope'))).toBeNull();
  });

  it('conserva una fecha ISO válida', () => {
    expect(fechaMysqlValida('2026-08-28')).toBe('2026-08-28');
  });

  it('al preparar el alta deja FechaDeBaja en null y no toca FechaDeAlta', () => {
    const data = prepararDatosCliente({
      Descripcion: 'Juan',
      FechaDeAlta: '2026-08-28',
      FechaDeBaja: '',
      CanalCodigo: ''
    });
    expect(data.FechaDeAlta).toBe('2026-08-28');
    expect(data.FechaDeBaja).toBeNull();
    expect(data.CanalCodigo).toBeNull();
  });

  it('explica el error de MySQL de FechaDeBaja', () => {
    const error = {
      name: 'SequelizeDatabaseError',
      parent: {
        code: 'ER_TRUNCATED_WRONG_VALUE',
        sqlMessage: "Incorrect date value: 'Invalid date' for column 'FechaDeBaja' at row 1"
      }
    };
    const described = describirErrorCliente(error, 'crear');
    expect(described.status).toBe(400);
    expect(described.message).toMatch(/fecha de baja/i);
    expect(described.campo).toBe('FechaDeBaja');
  });

  it('nombra el vendedor cuando falla la clave foránea', () => {
    const described = describirErrorCliente({
      name: 'SequelizeForeignKeyConstraintError',
      table: 't_vendedores',
      fields: { CodigoVendedor: '99' },
      parent: {
        sqlMessage:
          "Cannot add or update a child row: a foreign key constraint fails (`emp`.`clientes`, CONSTRAINT `clientes_ibfk_3` FOREIGN KEY (`CodigoVendedor`) REFERENCES `t_vendedores` (`Codigo`))"
      }
    });
    expect(described.status).toBe(400);
    expect(described.message).toMatch(/vendedor/i);
    expect(described.campo).toBe('CodigoVendedor');
  });

  it('explica un código duplicado', () => {
    const described = describirErrorCliente({
      name: 'SequelizeUniqueConstraintError',
      fields: { PRIMARY: '3223' },
      parent: {
        sqlMessage: "Duplicate entry '3223' for key 'PRIMARY'"
      }
    });
    expect(described.status).toBe(409);
    expect(described.message).toContain('3223');
    expect(described.campo).toBe('Codigo');
  });

  it('explica un valor demasiado largo', () => {
    const described = describirErrorCliente({
      name: 'SequelizeDatabaseError',
      parent: {
        code: 'ER_DATA_TOO_LONG',
        sqlMessage: "Data too long for column 'Calle' at row 1"
      }
    });
    expect(described.status).toBe(400);
    expect(described.message).toMatch(/calle/i);
    expect(described.campo).toBe('Calle');
  });
});
