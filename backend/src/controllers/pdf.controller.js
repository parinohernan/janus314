const PDFDocument = require("pdfkit");
// Reemplazar las importaciones directas de modelos por uso de req.models
// const FacturaCabeza = require("../models/facturaCabeza.model");
// const FacturaItem = require("../models/facturaItem.model");
// const Cliente = require("../models/cliente.model");
// const Articulo = require("../models/articulo.model");
const fs = require("fs");
const path = require("path");
const { getTemplateRenderer } = require("../templates/pdf");
// const DatosEmpresa = require("../models/datosEmpresa.model");
const renderFacturaA = require("../templates/pdf/facturaA.template");
const renderFacturaB = require("../templates/pdf/facturaB.template");
const renderPrefactura = require("../templates/pdf/prefactura.template.js");
const renderNotaCreditoA = require("../templates/pdf/notaCreditoA.template.js");
const renderNotaCreditoB = require("../templates/pdf/notaCreditoB.template.js");
const renderNotaCreditoF = require("../templates/pdf/notaCreditoF.template.js");
const renderNotaDebitoA = require("../templates/pdf/notaDebitoA.template.js");
const renderNotaDebitoB = require("../templates/pdf/notaDebitoB.template.js");
const renderNotaDebitoF = require("../templates/pdf/notaDebitoF.template.js");
const renderCuentaCorriente = require("../templates/pdf/cuentaCorriente.template.js");
// const renderNotaCreditoC = require("../templates/pdf/notaCreditoC.template");
// const renderNotaCreditoF = require("../templates/pdf/notaCreditoF.template");
// const NotaCreditoCabeza = require("../models/notaCreditoCabeza.model");
// const NotaCreditoItem = require("../models/notaCreditoItem.model");
// const datosEmpresaController = require("../controllers/datosEmpresa.controller");
const logoManager = require("../utils/logoManager");
const docFacturaA4 = { margin: 42.5, size: "A4" }; // 1.5cm = 42.5 puntos (1cm = 28.35 puntos)

// Función para generar PDF de factura
exports.generarFacturaPDF = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    
    console.log(`Generando PDF para factura: ${tipo}-${sucursal}-${numero}`);
    
    // Obtener los modelos dinámicos de la empresa actual
    const { FacturaCabeza, FacturaItem, Cliente, Articulo, DatosEmpresa } = req.models;

    // Obtener datos de la factura con el cliente
    const factura = await FacturaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 'Fecha',
        'ClienteCodigo', 'VendedorCodigo', 'PagoTipo', 'ImporteBruto',
        'PorcentajeBonificacion', 'ImporteBonificado', 'ImporteNeto',
        'ImporteAdicional', 'ImporteIva1', 'ImporteIva2', 'BaseImponible1',
        'BaseImponible2', 'ImporteTotal', 'ImportePagado', 'PorcentajeIva1',
        'PorcentajeIva2', 'ListaNumero', 'FechaAnulacion', 'Observacion',
        'CodigoUsuario', 'CajaNumero', 'afip_cae', 'afip_cae_vencimiento'
      ],
      include: [{ model: Cliente }],
      raw: false,
    });

    console.log('Factura encontrada:', factura ? 'Sí' : 'No');
    console.log('📋 Datos de la factura:', {
      DocumentoTipo: factura?.DocumentoTipo,
      DocumentoSucursal: factura?.DocumentoSucursal,
      DocumentoNumero: factura?.DocumentoNumero,
      afip_cae: factura?.afip_cae,
      afip_cae_vencimiento: factura?.afip_cae_vencimiento,
      ImporteTotal: factura?.ImporteTotal
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    console.log('Cliente encontrado:', factura.Cliente ? 'Sí' : 'No');

    // Obtener ítems de la factura
    const items = await FacturaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 
        'CodigoArticulo', 'Cantidad', 'ImporteCosto', 'PrecioLista', 
        'PorcentajeBonificado', 'ImporteBonificado', 'PrecioUnitario', 
        'DocumentoLiqTipo', 'DocumentoSucursal', 'DocumentoLiqNumero', 
        'LiqFecha', 'es_merma'
      ],
      raw: true,
    });

    console.log('Items encontrados:', items.length);

    // Obtener códigos de artículos para buscarlos
    const codigosArticulos = items.map((item) => item.CodigoArticulo);

    // Buscar los artículos correspondientes
    const articulos = await Articulo.findAll({
      where: {
        Codigo: codigosArticulos,
      },
      raw: true,
    });

    // Crear un mapa de artículos por código para facilitar la búsqueda
    const articulosPorCodigo = {};
    articulos.forEach((articulo) => {
      articulosPorCodigo[articulo.Codigo] = articulo;
    });

    // Combinar los items con la información de artículos
    const itemsConArticulos = items.map((item) => {
      const articulo = articulosPorCodigo[item.CodigoArticulo] || {};
      const subtotal = item.Cantidad * item.PrecioUnitario;
      const porcentajeIva = articulo.PorcentajeIVA1 || 0;
      const importeIva = subtotal * (porcentajeIva / 100);
      
      return {
        ...item,
        Descripcion: articulo.Descripcion || '',
        UnidadVenta: articulo.UnidadVenta || '',
        PrecioUnitario: item.PrecioUnitario || articulo.Lista1 || 0,
        PorcentajeBonificacion: item.PorcentajeBonificacion || 0,
        PorcentajeIVA1: articulo.PorcentajeIVA1 || 0,
        PorcentajeIVA2: articulo.PorcentajeIVA2 || 0,
        Total: subtotal,
        TotalConIva: subtotal + importeIva
      };
    });

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }
    
    // Asignar datos de empresa
    factura.Empresa = datosEmpresa;
    
    // Convertir la cadena de fecha InicioActividades a un objeto Date
    if (factura.Empresa.InicioActividades) {
      factura.Empresa.InicioActividades = new Date(factura.Empresa.InicioActividades);
    }

    // Preparar el logo de la empresa usando el LogoManager
    console.log('🖼️ Configurando logo de empresa...');
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado:', logoPath);

    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="factura-${tipo}-${sucursal}-${numero}.pdf"`
    );

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Aplicar plantilla según tipo de factura
    if (tipo === "FCA") {
      await renderFacturaA(doc, {
        factura: factura,
        items: itemsConArticulos,
        logoPath,
      });
    } else if (tipo === "FCB") {
      await renderFacturaB(doc, {
        factura: factura,
        items: itemsConArticulos,
        logoPath,
      });
    } else if (tipo === "PRF") {
      await renderPrefactura(doc, {
        prefactura: factura, // ✅ Corregido: cambiar 'factura' por 'prefactura'
        items: itemsConArticulos,
        logoPath,
      });
    } else {
      doc.fontSize(20).text("Tipo de factura no soportado", 100, 100);
    }

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error generando PDF de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF de factura",
      error: error.message,
    });
  }
};

// Función para generar PDF de prefactura
exports.generarPrefacturaPDF = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    
    // Obtener los modelos dinámicos de la empresa actual
    const { PreventaCabeza, PreventaItem, Cliente, Articulo, DatosEmpresa } = req.models;

    // Obtener datos de la prefactura con el cliente
    const prefactura = await PreventaCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Cliente }],
      raw: false,
    });

    if (!prefactura) {
      return res.status(404).json({
        success: false,
        message: "Prefactura no encontrada",
      });
    }

    // Obtener ítems de la prefactura
    const items = await PreventaItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ 
        model: Articulo,
        attributes: ['Codigo', 'Descripcion', 'UnidadVenta', 'Lista1', 'PorcentajeIVA1', 'PorcentajeIVA2']
      }],
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 
        'CodigoArticulo', 'Cantidad', 'PrecioUnitario'
      ]
    });

    // Combinar los items con la información de artículos
    const itemsConArticulos = items.map((item) => {
      const itemData = item.get({ plain: true });
      const articulo = itemData.Articulo || {};
      const subtotal = itemData.Cantidad * itemData.PrecioUnitario;
      const porcentajeIva = articulo.PorcentajeIVA1 || 0;
      const importeIva = subtotal * (porcentajeIva / 100);
      
      return {
        ...itemData,
        Descripcion: articulo.Descripcion || '',
        UnidadVenta: articulo.UnidadVenta || '',
        PrecioUnitario: itemData.PrecioUnitario || articulo.Lista1 || 0,
        PorcentajeIVA1: articulo.PorcentajeIVA1 || 0,
        PorcentajeIVA2: articulo.PorcentajeIVA2 || 0,
        Total: subtotal,
        TotalConIva: subtotal + importeIva
      };
    });

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }

    // Asignar datos de empresa
    prefactura.Empresa = datosEmpresa;
    
    // Convertir la cadena de fecha InicioActividades a un objeto Date
    if (prefactura.Empresa.InicioActividades) {
      prefactura.Empresa.InicioActividades = new Date(prefactura.Empresa.InicioActividades);
    }

    // Preparar el logo de la empresa usando el LogoManager
    console.log('🖼️ Configurando logo de empresa para prefactura...');
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado para prefactura:', logoPath);

    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="prefactura-${tipo}-${sucursal}-${numero}.pdf"`
    );

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Aplicar plantilla de prefactura
    await renderPrefactura(doc, {
      factura: prefactura,
      items: itemsConArticulos,
      logoPath,
    });

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error generando PDF de prefactura:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF de prefactura",
      error: error.message,
    });
  }
};

// Endpoint de prueba para verificar el logo
exports.probarLogo = async (req, res) => {
  try {
    console.log('🧪 Iniciando prueba de logo...');
    
    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="prueba-logo.pdf"`);

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Probar diferentes tipos de logo
    const pruebasLogo = [
      { nombre: "Logo por defecto", url: null },
      { nombre: "Logo local existente", url: "logoempresa.png" },
      { nombre: "Logo desde URL (ejemplo)", url: "https://via.placeholder.com/200x200/0066cc/ffffff?text=LOGO" }
    ];

    let y = 50;
    doc.fontSize(16).text("Prueba de LogoManager", 50, y);
    y += 30;

    for (let i = 0; i < pruebasLogo.length; i++) {
      const prueba = pruebasLogo[i];
      console.log(`🖼️ Probando ${prueba.nombre}:`, prueba.url || 'null');
      
      doc.fontSize(12).text(`${i + 1}. ${prueba.nombre}`, 50, y);
      doc.fontSize(10).text(`URL: ${prueba.url || 'null'}`, 50, y + 15);
      
      try {
        const logoPath = await logoManager.getLogoPath(prueba.url);
        doc.fontSize(10).text(`Ruta final: ${logoPath}`, 50, y + 30);
        
        // Verificar si el archivo existe
        const existe = fs.existsSync(logoPath);
        doc.fontSize(10).text(`Existe: ${existe ? 'Sí' : 'No'}`, 50, y + 45);
        
        if (existe) {
          try {
            doc.image(logoPath, 50, y + 60, {
              width: 100,
              height: 100
            });
            console.log(`✅ ${prueba.nombre} cargado exitosamente`);
            doc.fontSize(10).text(`✅ Cargado exitosamente`, 50, y + 170);
          } catch (error) {
            console.error(`❌ Error cargando ${prueba.nombre}:`, error);
            doc.fontSize(10).text(`❌ Error: ${error.message}`, 50, y + 60);
          }
        }
      } catch (error) {
        console.error(`❌ Error obteniendo ${prueba.nombre}:`, error);
        doc.fontSize(10).text(`❌ Error: ${error.message}`, 50, y + 30);
      }
      
      y += 200;
    }

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error en prueba de logo:", error);
    res.status(500).json({
      success: false,
      message: "Error en prueba de logo",
      error: error.message,
    });
  }
};

// Agregar el método para generar PDF de nota de crédito
exports.generarNotaCreditoPDF = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    
    // Obtener los modelos dinámicos de la empresa actual
    const { NotaCreditoCabeza, NotaCreditoItem, Cliente, Articulo, DatosEmpresa } = req.models;

    // Obtener datos de la nota de crédito con el cliente
    const notaCredito = await NotaCreditoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Cliente }],
      raw: false,
    });

    if (!notaCredito) {
      return res.status(404).json({
        success: false,
        message: "Nota de crédito no encontrada",
      });
    }

    // Obtener ítems de la nota de crédito - CORREGIDO: solo columnas que existen
    const items = await NotaCreditoItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ 
        model: Articulo,
        attributes: ['Codigo', 'Descripcion', 'UnidadVenta', 'Lista1', 'PorcentajeIVA1', 'PorcentajeIVA2']
      }],
      attributes: [
        'DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero', 
        'CodigoArticulo', 'Cantidad', 'PrecioUnitario'
        // Removidos: 'PorcentajeBonificado', 'ImporteBonificado' - no existen en la tabla
      ]
    });

    // Combinar los items con la información de artículos y calcular totales
    const itemsConArticulos = items.map((item) => {
      const itemData = item.get({ plain: true });
      const articulo = itemData.Articulo || {};
      const precioBase = itemData.PrecioUnitario || articulo.Lista1 || 0;
      const cantidad = itemData.Cantidad || 0;
      const porcentajeIva1 = articulo.PorcentajeIVA1 || 0;
      const porcentajeIva2 = articulo.PorcentajeIVA2 || 0;
      
      // Determinar qué porcentaje de IVA usar (normalmente es IVA1, pero puede ser IVA2 o 0)
      const porcentajeIva = porcentajeIva1 > 0 ? porcentajeIva1 : porcentajeIva2;
      
      // Solo NCA discrimina IVA (muestra precios SIN IVA)
      // NCB y NCF muestran precios CON IVA incluido
      let precioUnitario, subtotal, importeIva1, importeIva2;
      
      if (tipo === 'NCA') {
        // Para NCA: precios SIN IVA (se discrimina)
        precioUnitario = precioBase;
        subtotal = cantidad * precioUnitario;
        importeIva1 = subtotal * (porcentajeIva1 / 100);
        importeIva2 = subtotal * (porcentajeIva2 / 100);
      } else {
        // Para NCB y NCF: mostrar precios CON IVA incluido
        precioUnitario = precioBase * (1 + porcentajeIva / 100);
        subtotal = cantidad * precioUnitario;
        // El IVA ya está incluido en el precio, pero lo calculamos para los totales
        importeIva1 = (cantidad * precioBase) * (porcentajeIva1 / 100);
        importeIva2 = (cantidad * precioBase) * (porcentajeIva2 / 100);
      }
      
      // Para notas de crédito, no hay descuentos por item, se manejan a nivel cabecera
      const descuento = 0;
      const subtotalConDescuento = subtotal - descuento;
      
      return {
        ...itemData,
        Descripcion: articulo.Descripcion || '',
        UnidadVenta: articulo.UnidadVenta || '',
        PrecioUnitario: precioUnitario,
        PrecioBase: precioBase,
        PorcentajeIVA1: porcentajeIva1,
        PorcentajeIVA2: porcentajeIva2,
        PorcentajeIva: porcentajeIva, // El porcentaje principal aplicado
        Subtotal: subtotal,
        Descuento: descuento,
        SubtotalConDescuento: subtotalConDescuento,
        ImporteIva1: importeIva1,
        ImporteIva2: importeIva2,
        Total: tipo === 'NCA' ? subtotalConDescuento + importeIva1 + importeIva2 : subtotalConDescuento,
        PrecioConIva: precioUnitario, // Para templates que usan este campo
        TotalConIva: subtotal // Para templates que usan este campo
      };
    });

    // Calcular totales generales y agrupar IVA por porcentaje
    const totales = itemsConArticulos.reduce((acc, item) => {
      acc.subtotal += item.Subtotal || 0;
      acc.descuento += item.Descuento || 0;
      acc.subtotalConDescuento += item.SubtotalConDescuento || 0;
      acc.total += item.Total || 0;
      
      // Agrupar IVA por porcentaje real
      const porcentajeIva1 = item.PorcentajeIVA1 || 0;
      const porcentajeIva2 = item.PorcentajeIVA2 || 0;
      
      if (porcentajeIva1 > 0 && item.ImporteIva1 > 0) {
        if (!acc.ivasPorPorcentaje[porcentajeIva1]) {
          acc.ivasPorPorcentaje[porcentajeIva1] = 0;
        }
        acc.ivasPorPorcentaje[porcentajeIva1] += item.ImporteIva1;
      }
      
      if (porcentajeIva2 > 0 && item.ImporteIva2 > 0) {
        if (!acc.ivasPorPorcentaje[porcentajeIva2]) {
          acc.ivasPorPorcentaje[porcentajeIva2] = 0;
        }
        acc.ivasPorPorcentaje[porcentajeIva2] += item.ImporteIva2;
      }
      
      return acc;
    }, {
      subtotal: 0,
      descuento: 0,
      subtotalConDescuento: 0,
      total: 0,
      ivasPorPorcentaje: {}
    });

    // Calcular totales de IVA tradicionales (para compatibilidad)
    const iva21 = totales.ivasPorPorcentaje[21] || 0;
    const iva105 = totales.ivasPorPorcentaje[10.5] || 0;

    // Asignar los totales calculados a la nota de crédito
    // Usar los valores de la cabecera si están disponibles, sino los calculados
    notaCredito.ImporteBruto = notaCredito.ImporteBruto || totales.subtotal;
    notaCredito.ImporteBonificado = notaCredito.ImporteBonificado || totales.descuento;
    notaCredito.ImporteNeto = notaCredito.ImporteNeto || totales.subtotalConDescuento;
    notaCredito.ImporteIva1 = notaCredito.ImporteIva1 || iva21;
    notaCredito.ImporteIva2 = notaCredito.ImporteIva2 || iva105;
    notaCredito.ImporteTotal = notaCredito.ImporteTotal || totales.total;
    
    // Agregar array de IVAs por porcentaje para el template
    notaCredito.IvasPorPorcentaje = Object.entries(totales.ivasPorPorcentaje)
      .map(([porcentaje, importe]) => ({
        porcentaje: parseFloat(porcentaje),
        importe: importe
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje); // Ordenar de mayor a menor

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }

    // Asignar datos de empresa
    notaCredito.Empresa = datosEmpresa;
    
    // Convertir la cadena de fecha InicioActividades a un objeto Date
    if (notaCredito.Empresa.InicioActividades) {
      notaCredito.Empresa.InicioActividades = new Date(notaCredito.Empresa.InicioActividades);
    }
    
    // Agregar PagoTipo para mostrar en el PDF (derivado de ImporteUtilizado)
    // Si ImporteUtilizado es 0, es Cuenta Corriente (CC), sino es Contado (CO)
    notaCredito.PagoTipo = notaCredito.ImporteUtilizado === 0 ? 'CC' : 'CO';

    // Preparar el logo de la empresa usando el LogoManager
    console.log('🖼️ Configurando logo de empresa para nota de crédito...');
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado para nota de crédito:', logoPath);

    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="nota-credito-${tipo}-${sucursal}-${numero}.pdf"`
    );

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Aplicar plantilla según tipo de nota de crédito
    if (tipo === "NCA") {
      await renderNotaCreditoA(doc, {
        factura: notaCredito,
        items: itemsConArticulos,
        logoPath,
      });
    } else if (tipo === "NCB") {
      await renderNotaCreditoB(doc, {
        factura: notaCredito,
        items: itemsConArticulos,
        logoPath,
      });
    } else if (tipo === "NCC") {
      // await renderNotaCreditoC(doc, {
      //   factura: notaCredito,
      //   items: itemsConArticulos,
      //   logoPath,
      // });
      doc.fontSize(20).text("Tipo de nota de crédito no soportado", 100, 100);
    } else if (tipo === "NCF") {
      await renderNotaCreditoF(doc, {
        factura: notaCredito,
        items: itemsConArticulos,
        logoPath,
      });
    } else {
      doc.fontSize(20).text("Tipo de nota de crédito no soportado", 100, 100);
    }

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error generando PDF de nota de crédito:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF de nota de crédito",
      error: error.message,
    });
  }
};

// Función para generar PDF de cuenta corriente
exports.generarCuentaCorrientePDF = async (req, res) => {
  try {
    const { codigoCliente } = req.params;
    
    console.log(`Generando PDF para cuenta corriente del cliente: ${codigoCliente}`);
    
    // Obtener los modelos dinámicos de la empresa actual
    const { Cliente, FacturaCabeza, NotaCredito, NotaDebito, Recibo, DatosEmpresa } = req.models;

    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(codigoCliente);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      });
    }

    // Obtener todos los comprobantes del cliente
    let comprobantes = [];
    
    // Obtener facturas (excluyendo las anuladas)
    const facturas = await FacturaCabeza.findAll({
      where: { 
        ClienteCodigo: codigoCliente,
        FechaAnulacion: null
      },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImportePagado',
        'PagoTipo'
      ],
      order: [['Fecha', 'ASC']],
      raw: true
    });

    // Formatear facturas
    const facturasFormateadas = facturas.map(factura => ({
      Fecha: factura.Fecha,
      Detalle: `${factura.DocumentoTipo} - ${factura.DocumentoSucursal} - ${factura.DocumentoNumero}`,
      Debitos: factura.ImporteTotal,
      Creditos: factura.ImportePagado,
      Saldo: factura.PagoTipo === 'CC' ? 
        factura.ImporteTotal : 
        (factura.ImporteTotal - factura.ImportePagado),
      TipoComprobante: 'FAC'
    }));

    // Obtener notas de crédito
    const notasCredito = await NotaCredito.findAll({
      where: { CodigoCliente: codigoCliente },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImporteUtilizado'
      ],
      order: [['Fecha', 'ASC']],
      raw: true
    });

    // Formatear notas de crédito
    const notasCreditoFormateadas = notasCredito.map(nota => ({
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteUtilizado,
      Creditos: nota.ImporteTotal,
      Saldo: -1 * nota.ImporteTotal + nota.ImporteUtilizado,
      TipoComprobante: 'NC'
    }));

    // Obtener notas de débito
    const notasDebito = await NotaDebito.findAll({
      where: { ClienteCodigo: codigoCliente },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal',
        'ImportePagado'
      ],
      order: [['Fecha', 'ASC']],
      raw: true
    });

    // Formatear notas de débito
    const notasDebitoFormateadas = notasDebito.map(nota => ({
      Fecha: nota.Fecha,
      Detalle: `${nota.DocumentoTipo} - ${nota.DocumentoSucursal} - ${nota.DocumentoNumero}`,
      Debitos: nota.ImporteTotal || 0,
      Creditos: 0,
      Saldo: nota.ImporteTotal || 0,
      TipoComprobante: 'ND'
    }));

    // Obtener recibos
    const recibos = await Recibo.findAll({
      where: { 
        ClienteCodigo: codigoCliente,
        FechaAnulacion: null
      },
      attributes: [
        'Fecha',
        'DocumentoTipo',
        'DocumentoSucursal',
        'DocumentoNumero',
        'ImporteTotal'
      ],
      order: [['Fecha', 'ASC']],
      raw: true
    });

    // Formatear recibos
    const recibosFormateados = recibos.map(recibo => ({
      Fecha: recibo.Fecha,
      Detalle: `${recibo.DocumentoTipo} - ${recibo.DocumentoSucursal} - ${recibo.DocumentoNumero}`,
      Debitos: 0,
      Creditos: recibo.ImporteTotal,
      Saldo: -1 * recibo.ImporteTotal,
      TipoComprobante: 'REC'
    }));

    // Combinar todos los comprobantes
    comprobantes = [
      ...facturasFormateadas,
      ...notasCreditoFormateadas,
      ...notasDebitoFormateadas,
      ...recibosFormateados
    ];

    // Ordenar por fecha ascendente
    comprobantes.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

    // Calcular saldos acumulados
    let saldoAcumulado = 0;
    for (let i = 0; i < comprobantes.length; i++) {
      saldoAcumulado += comprobantes[i].Saldo;
      comprobantes[i].Saldo = saldoAcumulado;
    }

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }

    // Convertir la cadena de fecha InicioActividades a un objeto Date si es necesario
    if (datosEmpresa.InicioActividades && typeof datosEmpresa.InicioActividades === 'string') {
      try {
        datosEmpresa.InicioActividades = new Date(datosEmpresa.InicioActividades);
      } catch (error) {
        console.warn('⚠️ Error convirtiendo fecha InicioActividades:', error);
        datosEmpresa.InicioActividades = null;
      }
    }

    // Preparar el logo de la empresa usando el LogoManager
    console.log('🖼️ Configurando logo de empresa para cuenta corriente...');
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado para cuenta corriente:', logoPath);

    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="cuenta-corriente-${codigoCliente}.pdf"`
    );

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Aplicar plantilla de cuenta corriente
    await renderCuentaCorriente(doc, {
      cliente: cliente,
      comprobantes: comprobantes,
      datosEmpresa: datosEmpresa,
      logoPath,
    });

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error generando PDF de cuenta corriente:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF de cuenta corriente",
      error: error.message,
    });
  }
};

// Función para generar PDF de nota de débito
exports.generarNotaDebitoPDF = async (req, res) => {
  try {
    const { tipo, sucursal, numero } = req.params;
    
    console.log(`Generando PDF para nota de débito: ${tipo}-${sucursal}-${numero}`);
    
    // Obtener los modelos dinámicos de la empresa actual
    const { NotaDebitoCabeza, NotaDebitoItem, Cliente, DatosEmpresa } = req.models;

    // Obtener datos de la nota de débito con el cliente
    const notaDebito = await NotaDebitoCabeza.findOne({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      include: [{ model: Cliente, as: 'ClienteRelacion' }],
      raw: false,
    });

    if (!notaDebito) {
      return res.status(404).json({
        success: false,
        message: "Nota de débito no encontrada",
      });
    }

    console.log('Nota de débito encontrada:', notaDebito.DocumentoTipo);

    // Obtener ítems de la nota de débito
    const items = await NotaDebitoItem.findAll({
      where: {
        DocumentoTipo: tipo,
        DocumentoSucursal: sucursal,
        DocumentoNumero: numero,
      },
      attributes: ['Descripcion', 'Importe'],
      raw: true,
    });

    console.log('Items encontrados:', items.length);

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }

    // Convertir la cadena de fecha InicioActividades a un objeto Date
    if (datosEmpresa.InicioActividades && typeof datosEmpresa.InicioActividades === 'string') {
      try {
        datosEmpresa.InicioActividades = new Date(datosEmpresa.InicioActividades);
      } catch (error) {
        console.warn('⚠️ Error convirtiendo fecha InicioActividades:', error);
        datosEmpresa.InicioActividades = null;
      }
    }

    // Asignar datos de empresa a la nota de débito
    notaDebito.Empresa = datosEmpresa;

    // Asignar el cliente desde la relación
    if (notaDebito.ClienteRelacion) {
      notaDebito.Cliente = notaDebito.ClienteRelacion;
    }

    console.log('Cliente encontrado:', notaDebito.Cliente ? 'Sí' : 'No');

    // Preparar el logo de la empresa
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado:', logoPath);

    // Crear documento PDF
    const doc = new PDFDocument(docFacturaA4);

    // Configurar respuesta HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="nota-debito-${tipo}-${sucursal}-${numero}.pdf"`
    );

    // Pipe PDF a la respuesta
    doc.pipe(res);

    // Seleccionar plantilla según el tipo de nota de débito
    let renderFunction;
    if (tipo === "NDA") {
      renderFunction = renderNotaDebitoA;
    } else if (tipo === "NDB") {
      renderFunction = renderNotaDebitoB;
    } else if (tipo === "NDF") {
      renderFunction = renderNotaDebitoF;
    } else {
      return res.status(400).json({
        success: false,
        message: "Tipo de nota de débito no soportado",
      });
    }

    console.log(`Aplicando plantilla para ${tipo}...`);

    // Aplicar plantilla
    await renderFunction(doc, {
      notaDebito: notaDebito,
      items: items,
      logoPath: logoPath,
    });

    console.log("Finalizando documento...");

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Error generando PDF de nota de débito:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF de nota de débito",
      error: error.message,
    });
  }
};

