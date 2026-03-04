const { Op } = require('sequelize');
const NumeroControlService = require('../services/numeroControl.service');

exports.listarOrdenes = async (req, res) => {
  try {
    const { OrdenCompraCabeza, Proveedor } = req.models;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const proveedorCodigo = req.query.proveedor || null;
    const fechaDesde = req.query.fechaDesde || null;
    const fechaHasta = req.query.fechaHasta || null;

    const whereClause = {};
    if (proveedorCodigo) whereClause.ProveedorCodigo = proveedorCodigo;
    if (fechaDesde && fechaHasta) {
      whereClause.Fecha = { [Op.between]: [fechaDesde, fechaHasta] };
    } else if (fechaDesde) {
      whereClause.Fecha = { [Op.gte]: fechaDesde };
    } else if (fechaHasta) {
      whereClause.Fecha = { [Op.lte]: fechaHasta };
    }

    const ordenes = await OrdenCompraCabeza.findAndCountAll({
      where: whereClause,
      attributes: [
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'Fecha',
        'FechaDeEntrega',
        'ProveedorCodigo',
        'ImporteTotal',
        'FechaAnulacion',
      ],
      include: [
        {
          model: Proveedor,
          as: 'ProveedorRelacion',
          attributes: ['Codigo', 'Descripcion'],
        },
      ],
      order: [
        ['Fecha', 'DESC'],
        ['DocumentoNumero', 'DESC'],
      ],
      limit,
      offset,
    });

    const items = ordenes.rows.map((o) => {
      const item = o.toJSON();
      if (item.Fecha) {
        const d = new Date(item.Fecha);
        item.FechaFormateada = d.toISOString().split('T')[0];
      }
      if (item.FechaDeEntrega) {
        const d = new Date(item.FechaDeEntrega);
        item.FechaDeEntregaFormateada = d.toISOString().split('T')[0];
      }
      return item;
    });

    res.json({
      items,
      meta: {
        totalItems: ordenes.count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(ordenes.count / limit),
      },
    });
  } catch (error) {
    console.error('Error al listar órdenes de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes de compra',
      error: error.message,
    });
  }
};

exports.obtenerOrden = async (req, res) => {
  try {
    const { OrdenCompraCabeza, OrdenCompraItem, Proveedor, Articulo } = req.models;
    const { tipo, sucursal, numero } = req.params;
    const docNumero = String(numero || "").trim().padStart(8, "0");
    const docSucursal = String(sucursal || "").trim();

    const orden = await OrdenCompraCabeza.findOne({
      where: {
        DocumentoTipo: String(tipo || "").trim(),
        DocumentoSucursal: docSucursal,
        DocumentoNumero: docNumero,
      },
      include: [
        {
          model: Proveedor,
          as: 'ProveedorRelacion',
          attributes: ['Codigo', 'Descripcion', 'Cuit', 'Telefono'],
        },
      ],
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada',
      });
    }

    const cabeza = orden.toJSON();
    if (cabeza.Fecha) {
      const d = new Date(cabeza.Fecha);
      cabeza.FechaFormateada = d.toISOString().split('T')[0];
    }
    if (cabeza.FechaDeEntrega) {
      const d = new Date(cabeza.FechaDeEntrega);
      cabeza.FechaDeEntregaFormateada = d.toISOString().split('T')[0];
    }

    const items = await OrdenCompraItem.findAll({
      where: {
        DocumentoTipo: String(tipo || "").trim(),
        DocumentoSucursal: docSucursal,
        DocumentoNumero: docNumero,
      },
      attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'ProveedorCodigo', 'CodigoArticulo', 'Cantidad', 'PrecioCostoUnitario'],
      include: [
        {
          model: Articulo,
          as: 'Articulo',
          required: false,
          attributes: ['Codigo', 'Descripcion', 'PrecioCosto'],
        },
      ],
    });

    return res.status(200).json({
      ...cabeza,
      Items: items.map((i) => i.toJSON()),
    });
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden de compra',
      error: error.message,
    });
  }
};

exports.crearOrden = async (req, res) => {
  const {
    OrdenCompraCabeza,
    OrdenCompraItem,
    Proveedor,
    Articulo,
    DatosEmpresa,
    NumerosControl,
  } = req.models;
  const sequelize = Proveedor.sequelize;
  const t = await sequelize.transaction();

  try {
    const {
      Fecha,
      FechaDeEntrega,
      ProveedorCodigo,
      TipoPago,
      Observacion,
      RemitoNro,
      Items = [],
    } = req.body;

    if (!ProveedorCodigo || !Fecha) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Proveedor y fecha son obligatorios',
      });
    }

    if (!Items || Items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ítem en la orden',
      });
    }

    const prov = await Proveedor.findByPk(ProveedorCodigo, { transaction: t });
    if (!prov) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Proveedor no encontrado' });
    }

    const datosEmpresa = await DatosEmpresa.findOne({ transaction: t });
    const sucursal = datosEmpresa && datosEmpresa.Sucursal
      ? String(datosEmpresa.Sucursal).trim().padStart(4, '0')
      : '01';

    let numeroControl = await NumerosControl.findOne({
      where: { Codigo: 'OC', Sucursal: sucursal },
      transaction: t
    });
    if (!numeroControl) {
      await NumerosControl.create({
        Codigo: 'OC',
        Descripcion: 'Orden de Compra',
        NumeroProximo: 1,
        Copias: 1,
        Sucursal: sucursal
      }, { transaction: t });
    }

    const documentoNumero = await NumeroControlService.obtenerYActualizarNumero(
      'OC',
      sucursal,
      t,
      NumerosControl
    );

    const documentoTipo = 'OC';

    let importeTotal = 0;
    const itemsParaCrear = [];
    for (const it of Items) {
      const { CodigoArticulo, Cantidad, PrecioCostoUnitario } = it;
      if (!CodigoArticulo) continue;
      const cant = parseFloat(Cantidad) || 0;
      const precio = parseFloat(PrecioCostoUnitario) || 0;
      const subtotal = cant * precio;
      importeTotal += subtotal;
      itemsParaCrear.push({
        DocumentoTipo: documentoTipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
        ProveedorCodigo: ProveedorCodigo.substring(0, 7),
        CodigoArticulo,
        Cantidad: cant,
        PrecioCostoUnitario: precio,
      });
    }

    if (itemsParaCrear.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ítem válido',
      });
    }

    await OrdenCompraCabeza.create(
      {
        DocumentoTipo: documentoTipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
        Fecha,
        FechaDeEntrega: FechaDeEntrega || null,
        ProveedorCodigo,
        TipoPago: TipoPago || null,
        ImporteBruto: importeTotal,
        ImporteNeto: importeTotal,
        ImporteAdicional: 0,
        ImporteIva1: 0,
        ImporteIva2: 0,
        Percepcion: 0,
        ImporteTotal: importeTotal,
        Observacion: Observacion || null,
        ObservacionAnula: null,
        RemitoNro: RemitoNro || null,
        FechaAnulacion: null,
      },
      { transaction: t }
    );

    for (const it of itemsParaCrear) {
      await OrdenCompraItem.create(it, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({
      success: true,
      message: 'Orden de compra creada',
      data: {
        DocumentoTipo: documentoTipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: documentoNumero,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error('Error crear orden de compra:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la orden de compra',
      error: error.message,
    });
  }
};
