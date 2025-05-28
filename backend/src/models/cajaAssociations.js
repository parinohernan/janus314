const CajaCabeza = require('./cajaCabeza.model');
const CajaMovimientos = require('./cajaMovimientos.model');
const CajaArqueoDetalle = require('./cajaArqueoDetalle.model');
const Vendedor = require('./vendedor.model');
const TipoDePago = require('./tipoDePago.model');

// Asociaciones CajaCabeza
CajaCabeza.belongsTo(Vendedor, { foreignKey: 'VendedorId', as: 'Vendedor' });
CajaCabeza.hasMany(CajaMovimientos, { foreignKey: 'CajaCabezaId', as: 'Movimientos' });
CajaCabeza.hasMany(CajaArqueoDetalle, { foreignKey: 'CajaCabezaId', as: 'ArqueoDetalles' });

// Asociaciones CajaMovimientos
CajaMovimientos.belongsTo(CajaCabeza, { foreignKey: 'CajaCabezaId', as: 'Caja' });
CajaMovimientos.belongsTo(TipoDePago, { foreignKey: 'MetodoPago', as: 'TipoPago' });
CajaMovimientos.belongsTo(Vendedor, { foreignKey: 'UsuarioId', as: 'Usuario' });

// Asociaciones CajaArqueoDetalle
CajaArqueoDetalle.belongsTo(CajaCabeza, { foreignKey: 'CajaCabezaId', as: 'Caja' });
CajaArqueoDetalle.belongsTo(TipoDePago, { foreignKey: 'MetodoPago', as: 'TipoPago' });

module.exports = {
  CajaCabeza,
  CajaMovimientos,
  CajaArqueoDetalle
}; 