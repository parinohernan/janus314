const ReciboCabeza = require('../models/reciboCabeza.model');
const ReciboItem = require('../models/reciboItem.model');
const Cliente = require('../models/cliente.model');
const Usuario = require('../models/usuario.model');
const Vendedor = require('../models/vendedor.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los recibos (con filtros y paginación)
exports.getAllRecibos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      field = 'Fecha',
      order = 'DESC',
      clienteCodigo = '',
      fechaDesde = '',
      fechaHasta = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (clienteCodigo) {
      whereClause.ClienteCodigo = clienteCodigo;
    }
    
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }
    
    if (search) {
      whereClause.DocumentoNumero = { [Op.like]: `%${search}%` };
    }

    const validFields = ['Fecha', 'DocumentoNumero', 'ImporteTotal', 'ClienteCodigo'];
    const sortField = validFields.includes(field) ? field : 'Fecha';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const count = await ReciboCabeza.count({ where: whereClause });

    const recibos = await ReciboCabeza.findAll({
      where: whereClause,
      order: [
        ['Fecha', sortOrder],
        ['DocumentoSucursal', sortOrder],
        ['DocumentoNumero', sortOrder]
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Descripcion', 'NombreFantasia']
        },
        {
          model: Usuario,
          as: 'UsuarioRelacion',
          attributes: ['Descripcion']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Descripcion']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: recibos,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener los recibos' });
  }
};

// Obtener un recibo por ID
exports.getReciboById = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    console.log("tipo, sucursal, numero", tipo, sucursal, numero);
    
    // Obtener encabezado
    const recibo = await ReciboCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Descripcion', 'NombreFantasia', 'Cuit']
        },
        {
          model: Usuario,
          as: 'UsuarioRelacion',
          attributes: ['Descripcion']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Descripcion']
        }
      ]
    });

    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }

    // Obtener items manualmente
    const items = await ReciboItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });

    // Combinar los datos
    const reciboCompleto = {
      ...recibo.toJSON(),
      Items: items
    };

    return res.status(200).json(reciboCompleto);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener el recibo' });
  }
};

// Crear un nuevo recibo
exports.createRecibo = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { cabeza, items } = req.body;
    
    if (!cabeza.DocumentoTipo || !cabeza.DocumentoSucursal || !cabeza.DocumentoNumero || !cabeza.ClienteCodigo) {
      return res.status(400).json({ message: 'Faltan datos obligatorios en el recibo' });
    }
    
    const existingRecibo = await ReciboCabeza.findOne({
      where: {
        DocumentoTipo: cabeza.DocumentoTipo,
        DocumentoSucursal: cabeza.DocumentoSucursal,
        DocumentoNumero: cabeza.DocumentoNumero
      }
    });
    
    if (existingRecibo) {
      return res.status(400).json({ message: 'Ya existe un recibo con ese número' });
    }
    
    const nuevoRecibo = await ReciboCabeza.create(cabeza, { transaction });
    
    if (items && items.length > 0) {
      const itemsToCreate = items.map(item => ({
        ...item,
        DocumentoTipo: cabeza.DocumentoTipo,
        DocumentoSucursal: cabeza.DocumentoSucursal,
        DocumentoNumero: cabeza.DocumentoNumero
      }));
      
      await ReciboItem.bulkCreate(itemsToCreate, { transaction });
    }
    
    await transaction.commit();
    
    return res.status(201).json({
      message: 'Recibo creado correctamente',
      recibo: nuevoRecibo
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el recibo' });
  }
};

// Actualizar un recibo
exports.updateRecibo = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    const { cabeza, items } = req.body;
    
    const recibo = await ReciboCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    
    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    
    if (recibo.FechaAnulacion) {
      return res.status(400).json({ message: 'No se puede modificar un recibo anulado' });
    }
    
    await recibo.update(cabeza, { transaction });
    
    if (items && items.length > 0) {
      await ReciboItem.destroy({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        },
        transaction
      });
      
      const itemsToCreate = items.map(item => ({
        ...item,
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }));
      
      await ReciboItem.bulkCreate(itemsToCreate, { transaction });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Recibo actualizado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar el recibo' });
  }
};

// Anular un recibo
exports.anularRecibo = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tipo, sucursal, numero } = req.params;
    
    const recibo = await ReciboCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    
    if (!recibo) {
      return res.status(404).json({ message: 'Recibo no encontrado' });
    }
    
    if (recibo.FechaAnulacion) {
      return res.status(400).json({ message: 'El recibo ya está anulado' });
    }
    
    await recibo.update({
      FechaAnulacion: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Recibo anulado correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al anular el recibo' });
  }
}; 