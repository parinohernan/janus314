// Este archivo define las relaciones entre modelos para evitar dependencias circulares
const ReciboCabeza = require('./reciboCabeza.model');
const ReciboItem = require('./reciboItem.model');

// Exportar los modelos sin asociaciones entre ellos
module.exports = {
  ReciboCabeza,
  ReciboItem
}; 