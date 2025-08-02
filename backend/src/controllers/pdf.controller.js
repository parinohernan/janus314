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
      const precioUnitario = itemData.PrecioUnitario || articulo.Lista1 || 0;
      const cantidad = itemData.Cantidad || 0;
      const subtotal = cantidad * precioUnitario;
      // Para notas de crédito, no hay descuentos por item, se manejan a nivel cabecera
      const descuento = 0; // Los descuentos se manejan en la cabecera
      const subtotalConDescuento = subtotal - descuento;
      const porcentajeIva1 = articulo.PorcentajeIVA1 || 0;
      const porcentajeIva2 = articulo.PorcentajeIVA2 || 0;
      const importeIva1 = subtotalConDescuento * (porcentajeIva1 / 100);
      const importeIva2 = subtotalConDescuento * (porcentajeIva2 / 100);
      
      return {
        ...itemData,
        Descripcion: articulo.Descripcion || '',
        UnidadVenta: articulo.UnidadVenta || '',
        PrecioUnitario: precioUnitario,
        PorcentajeIVA1: porcentajeIva1,
        PorcentajeIVA2: porcentajeIva2,
        Subtotal: subtotal,
        Descuento: descuento,
        SubtotalConDescuento: subtotalConDescuento,
        ImporteIva1: importeIva1,
        ImporteIva2: importeIva2,
        Total: subtotalConDescuento + importeIva1 + importeIva2
      };
    });

    // Calcular totales generales
    const totales = itemsConArticulos.reduce((acc, item) => {
      acc.subtotal += item.Subtotal || 0;
      acc.descuento += item.Descuento || 0;
      acc.subtotalConDescuento += item.SubtotalConDescuento || 0;
      acc.iva1 += item.ImporteIva1 || 0;
      acc.iva2 += item.ImporteIva2 || 0;
      acc.total += item.Total || 0;
      return acc;
    }, {
      subtotal: 0,
      descuento: 0,
      subtotalConDescuento: 0,
      iva1: 0,
      iva2: 0,
      total: 0
    });

    // Asignar los totales calculados a la nota de crédito
    // Usar los valores de la cabecera si están disponibles, sino los calculados
    notaCredito.ImporteBruto = notaCredito.ImporteBruto || totales.subtotal;
    notaCredito.ImporteBonificado = notaCredito.ImporteBonificado || totales.descuento;
    notaCredito.ImporteNeto = notaCredito.ImporteNeto || totales.subtotalConDescuento;
    notaCredito.ImporteIva1 = notaCredito.ImporteIva1 || totales.iva1;
    notaCredito.ImporteIva2 = notaCredito.ImporteIva2 || totales.iva2;
    notaCredito.ImporteTotal = notaCredito.ImporteTotal || totales.total;

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
