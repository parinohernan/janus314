const { Op } = require('sequelize');
const numerosControl = require('./numerosControl.controller');

// Obtener todas las notas de débito (con filtros y paginación)
exports.getAllNotasDebito = async (req, res) => {
  try {
    const { NotaDebitoCabeza, Cliente, Vendedor } = req.models;
    
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

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Configurar opciones de búsqueda
    const whereClause = {};
    
    // Filtro por cliente
    if (clienteCodigo) {
      whereClause.ClienteCodigo = clienteCodigo;
    }
    
    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      whereClause.Fecha = {};
      if (fechaDesde) whereClause.Fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.Fecha[Op.lte] = fechaHasta;
    }
    
    // Filtro por búsqueda (en número de documento)
    if (search) {
      whereClause.DocumentoNumero = { [Op.like]: `%${search}%` };
    }

    // Validar campo de ordenamiento
    const validFields = ['Fecha', 'DocumentoNumero', 'ImporteTotal', 'ClienteCodigo'];
    const sortField = validFields.includes(field) ? field : 'Fecha';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Obtener total de registros para metadata de paginación
    const count = await NotaDebitoCabeza.count({ where: whereClause });

    // Obtener registros paginados
    const notasDebito = await NotaDebitoCabeza.findAll({
      where: whereClause,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Descripcion', 'NombreFantasia']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Descripcion']
        }
      ]
    });

    // Calcular páginas totales y devolver con metadatos de paginación
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      items: notasDebito,
      meta: {
        totalItems: count,
        itemsPerPage: parseInt(limit),
        currentPage: parseInt(page),
        totalPages: totalPages
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener las notas de débito' });
  }
};

// Obtener una nota de débito por ID
exports.getNotaDebitoById = async (req, res) => {
  try {
    const { NotaDebitoCabeza, NotaDebitoItem, Cliente, Vendedor } = req.models;
    const { tipo, sucursal, numero } = req.params;
    
    const notaDebito = await NotaDebitoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      },
      include: [
        {
          model: Cliente,
          as: 'ClienteRelacion',
          attributes: ['Codigo', 'Descripcion', 'NombreFantasia', 'Cuit']
        },
        {
          model: Vendedor,
          as: 'VendedorRelacion',
          attributes: ['Codigo', 'Descripcion']
        }
      ]
    });

    if (!notaDebito) {
      return res.status(404).json({ message: 'Nota de débito no encontrada' });
    }

    // Obtener items por separado debido a la clave compuesta
    const items = await NotaDebitoItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });

    // Convertir a JSON y agregar los items
    const notaDebitoJSON = notaDebito.toJSON();
    notaDebitoJSON.Items = items;

    return res.status(200).json(notaDebitoJSON);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Error al obtener la nota de débito',
      error: error.message 
    });
  }
};

// Crear una nueva nota de débito
exports.createNotaDebito = async (req, res) => {
  try {
    const { NotaDebitoCabeza, NotaDebitoItem, Cliente } = req.models;
    const connection = req.db;

    const transaction = await connection.transaction();

    try {
      const { cabeza, items } = req.body;

      // Validar datos obligatorios (DocumentoNumero lo asigna el backend)
      if (!cabeza.DocumentoTipo || !cabeza.DocumentoSucursal || !cabeza.ClienteCodigo) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Faltan datos obligatorios en la nota de débito' });
      }

      // Obtener y reservar el próximo número de control (dentro de la transacción)
      const numeroAsignado = await numerosControl.actualizarNumeroDirecto(
        cabeza.DocumentoTipo,
        cabeza.DocumentoSucursal,
        cabeza.ImporteTotal,
        transaction,
        req.models
      );
      cabeza.DocumentoNumero = numeroAsignado;
      console.log("*/*/*/*/*/numeroAsignado", numeroAsignado);

      // Verificar si ya existe una nota de débito con ese número (por si hubiera race)
      const existingNota = await NotaDebitoCabeza.findOne({
        where: {
          DocumentoTipo: cabeza.DocumentoTipo,
          DocumentoSucursal: cabeza.DocumentoSucursal,
          DocumentoNumero: cabeza.DocumentoNumero
        },
        transaction
      });

      if (existingNota) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Ya existe una nota de débito con ese número' });
      }

      // Crear la nota de débito
      const nuevaNotaDebito = await NotaDebitoCabeza.create(cabeza, { transaction });

      // Crear los items de la nota de débito
      if (items && items.length > 0) {
        const itemsToCreate = items.map(item => ({
          ...item,
          DocumentoTipo: cabeza.DocumentoTipo,
          DocumentoSucursal: cabeza.DocumentoSucursal,
          DocumentoNumero: cabeza.DocumentoNumero
        }));

        await NotaDebitoItem.bulkCreate(itemsToCreate, { transaction });
      }

      // Actualizar el importe de deuda del cliente (siempre en cuenta corriente)
      console.log("Actualizando deuda del cliente para nota de débito", cabeza);

      // Obtener el cliente
      const cliente = await Cliente.findByPk(cabeza.ClienteCodigo, { transaction });

      if (!cliente) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Cliente no encontrado: ${cabeza.ClienteCodigo}`
        });
      }

      // Actualizar la deuda del cliente (sumar el importe de la nota de débito)
      await cliente.update(
        {
          ImporteDeuda: (cliente.ImporteDeuda || 0) + cabeza.ImporteTotal
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        message: 'Nota de débito creada correctamente',
        notaDebito: nuevaNotaDebito
      });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      return res.status(500).json({
        message: 'Error al crear la nota de débito',
        error: error.message
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al crear la nota de débito',
      error: error.message
    });
  }
};

// Actualizar una nota de débito
exports.updateNotaDebito = async (req, res) => {
  try {
    const { NotaDebitoCabeza, NotaDebitoItem } = req.models;
    const connection = req.db;
    
    const transaction = await connection.transaction();
    
    try {
      const { tipo, sucursal, numero } = req.params;
      const { cabeza, items } = req.body;
    
    // Buscar la nota de débito
    const notaDebito = await NotaDebitoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    
    if (!notaDebito) {
      return res.status(404).json({ message: 'Nota de débito no encontrada' });
    }
    
    // Verificar si la nota está anulada
    if (notaDebito.FechaAnulacion) {
      return res.status(400).json({ message: 'No se puede modificar una nota de débito anulada' });
    }
    
    // Actualizar la nota de débito
    await notaDebito.update(cabeza, { transaction });
    
    // Actualizar los items
    if (items && items.length > 0) {
      // Eliminar items existentes
      await NotaDebitoItem.destroy({
        where: {
          DocumentoTipo: tipo,
          DocumentoSucursal: sucursal,
          DocumentoNumero: numero
        },
        transaction
      });
      
      // Crear nuevos items
      const itemsToCreate = items.map(item => ({
        ...item,
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }));
      
      await NotaDebitoItem.bulkCreate(itemsToCreate, { transaction });
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Nota de débito actualizada correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la nota de débito' });
  }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la nota de débito' });
  }
};

// Anular una nota de débito
exports.anularNotaDebito = async (req, res) => {
  try {
    const { NotaDebitoCabeza } = req.models;
    const connection = req.db;
    
    const transaction = await connection.transaction();
    
    try {
      const { tipo, sucursal, numero } = req.params;
      const { motivoAnulacion } = req.body;
    
    // Buscar la nota de débito
    const notaDebito = await NotaDebitoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero
      }
    });
    
    if (!notaDebito) {
      return res.status(404).json({ message: 'Nota de débito no encontrada' });
    }
    
    // Verificar si la nota ya está anulada
    if (notaDebito.FechaAnulacion) {
      return res.status(400).json({ message: 'La nota de débito ya está anulada' });
    }
    
    // Anular la nota de débito
    await notaDebito.update({
      FechaAnulacion: new Date(),
      // Aquí podrías guardar el motivo de anulación si tienes un campo para eso
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      message: 'Nota de débito anulada correctamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Error al anular la nota de débito' });
  }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al anular la nota de débito' });
  }
}; 