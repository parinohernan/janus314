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

    console.log('Artículos encontrados:', articulos.length);

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
        PrecioLista: item.PrecioLista || articulo.Lista1 || 0,
        PorcentajeBonificacion: item.PorcentajeBonificacion || 0,
        PorcentajeIVA1: articulo.PorcentajeIVA1 || 0,
        PorcentajeIVA2: articulo.PorcentajeIVA2 || 0,
        Total: subtotal,
        TotalConIva: subtotal + importeIva
      };
    });

    // Obtener datos de la empresa
    const datosEmpresa = await DatosEmpresa.findOne();
    console.log('Datos de empresa encontrados:', datosEmpresa ? 'Sí' : 'No');
    
    if (!datosEmpresa) {
      return res.status(404).json({
        success: false,
        message: "Datos de empresa no encontrados",
      });
    }
    
    // Asignar datos de empresa a la factura para la plantilla
    factura.Empresa = datosEmpresa;
    
    // Convertir la cadena de fecha InicioActividades a un objeto Date
    if (factura.Empresa.InicioActividades) {
      factura.Empresa.InicioActividades = new Date(factura.Empresa.InicioActividades);
    }

    // Preparar el logo de la empresa usando el LogoManager
    console.log('🖼️ Configurando logo de empresa...');
    const logoPath = await logoManager.getLogoPath(datosEmpresa.LogoURL);
    console.log('✅ Logo configurado:', logoPath);

    console.log('Iniciando generación del PDF...');

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

    // Aplicar plantilla adecuada según tipo de documento
    if (tipo === "FCA" || tipo === "NCA" || tipo === "NDA") {
      console.log('Aplicando plantilla Factura A...');
      await renderFacturaA(doc, { factura, items: itemsConArticulos, logoPath });
    } else if (tipo === "FCB" || tipo === "NCB" || tipo === "NDB") {
      console.log('Aplicando plantilla Factura B...');
      await renderFacturaB(doc, { factura, items: itemsConArticulos, logoPath });
    } else if (tipo === "PRF") {
      console.log('Aplicando plantilla Prefactura...');
      await renderPrefactura(doc, { prefactura: factura, items: itemsConArticulos, logoPath });
    } else {
      // Si el tipo no está entre los soportados, mostrar mensaje
      doc.fontSize(20).text("Tipo de documento no soportado", 100, 100);
    }

    console.log('Finalizando documento PDF...');
    // Finalizar documento
    doc.end();
    
    console.log('✅ PDF generado exitosamente');
  } catch (error) {
    console.error("Error generando PDF:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF",
      error: error.message,
    });
  }
};

// Función para generar el contenido del PDF
function generarContenidoPDF(doc, factura, items) {
  // Encabezado
  doc.fontSize(20).text("FACTURA", { align: "center" });
  doc.moveDown();

  // Tipo de factura
  let tipoFactura = "";
  switch (factura.DocumentoTipo) {
    case "FCA":
      tipoFactura = "FACTURA A";
      break;
    case "FCB":
      tipoFactura = "FACTURA B";
      break;
    case "FCC":
      tipoFactura = "FACTURA C";
      break;
    default:
      tipoFactura = `FACTURA ${factura.DocumentoTipo}`;
  }

  doc
    .fontSize(16)
    .text(
      `${tipoFactura} N° ${factura.DocumentoSucursal}-${factura.DocumentoNumero}`,
      { align: "center" }
    );
  doc.moveDown();

  // Información de la empresa
  doc.fontSize(12).text("EMPRESA S.A.", { align: "left" });
  doc.fontSize(10).text("CUIT: 30-12345678-9");
  doc.text("Dirección: Calle Principal 123, Ciudad");
  doc.text("Tel: (123) 456-7890");
  doc.moveDown();

  // Información del cliente
  doc.fontSize(12).text("DATOS DEL CLIENTE", { align: "left" });
  doc
    .fontSize(10)
    .text(`Cliente: ${factura.Cliente ? factura.Cliente.Descripcion : "N/A"}`);
  doc.text(`CUIT: ${factura.Cliente ? factura.Cliente.Cuit : "N/A"}`);
  doc.text(`Calle: ${factura.Cliente ? factura.Cliente.Calle : "N/A"}`);
  doc.text(`Localidad: ${factura.Cliente ? factura.Cliente.Localidad : "N/A"}`);
  doc.moveDown();

  // Fecha y CAE
  doc
    .fontSize(10)
    .text(`Fecha: ${new Date(factura.Fecha).toLocaleDateString("es-AR")}`);
  if (factura.afip_cae) {
    doc.text(`CAE: ${factura.afip_cae}`);
    doc.text(
      `Vencimiento CAE: ${new Date(
        factura.afip_cae_vencimiento
      ).toLocaleDateString("es-AR")}`
    );
  }
  doc.moveDown();

  // Tabla de items
  doc.fontSize(10);
  const tableTop = doc.y;
  const itemsTableTop = tableTop + 20;

  // Encabezados de la tabla
  doc.font("Helvetica-Bold");
  doc.text("Código", 50, tableTop, { width: 80 });
  doc.text("Descripción", 130, tableTop, { width: 200 });
  doc.text("Cant.", 330, tableTop, { width: 40, align: "right" });
  doc.text("Precio", 370, tableTop, { width: 70, align: "right" });
  doc.text("Subtotal", 440, tableTop, { width: 70, align: "right" });
  doc.font("Helvetica");

  // Línea horizontal
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(510, tableTop + 15)
    .stroke();

  // Items
  let y = itemsTableTop;
  items.forEach((item, i) => {
    const cantidad = item.Cantidad || 0;
    const precioUnitario = item.PrecioUnitario || 0;
    const subtotal = cantidad * precioUnitario;

    // Si no hay suficiente espacio en la página, crear una nueva
    if (y > 700) {
      doc.addPage();
      y = 50;

      // Repetir encabezados en la nueva página
      doc.font("Helvetica-Bold");
      doc.text("Código", 50, y - 20, { width: 80 });
      doc.text("Descripción", 130, y - 20, { width: 200 });
      doc.text("Cant.", 330, y - 20, { width: 40, align: "right" });
      doc.text("Precio", 370, y - 20, { width: 70, align: "right" });
      doc.text("Subtotal", 440, y - 20, { width: 70, align: "right" });
      doc.font("Helvetica");

      // Línea horizontal
      doc
        .moveTo(50, y - 5)
        .lineTo(510, y - 5)
        .stroke();
    }

    doc.text(item.CodigoArticulo || "", 50, y, { width: 80 });
    doc.text(item.Descripcion || "", 130, y, { width: 200 });
    doc.text(cantidad.toString(), 330, y, { width: 40, align: "right" });
    doc.text(precioUnitario.toFixed(2), 370, y, { width: 70, align: "right" });
    doc.text(subtotal.toFixed(2), 440, y, { width: 70, align: "right" });

    y += 20;
  });

  // Línea horizontal
  doc.moveTo(50, y).lineTo(510, y).stroke();
  y += 10;

  // Totales
  doc.font("Helvetica-Bold");
  doc.text("Subtotal:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteNeto ? factura.ImporteNeto.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );
  y += 20;

  doc.text("IVA:", 350, y, { width: 90, align: "right" });
  const iva = (factura.ImporteIva1 || 0) + (factura.ImporteIva2 || 0);
  doc.text(iva.toFixed(2), 440, y, { width: 70, align: "right" });
  y += 20;

  doc.text("TOTAL:", 350, y, { width: 90, align: "right" });
  doc.text(
    factura.ImporteTotal ? factura.ImporteTotal.toFixed(2) : "0.00",
    440,
    y,
    { width: 70, align: "right" }
  );

  // Pie de página
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Agregar número de página
    doc
      .fontSize(8)
      .text(`Página ${i + 1} de ${pageCount}`, 50, doc.page.height - 50, {
        align: "center",
        width: doc.page.width - 100,
      });

    // Agregar información legal
    if (i === pageCount - 1) {
      doc
        .fontSize(8)
        .text("Documento no válido como factura", 50, doc.page.height - 30, {
          align: "center",
          width: doc.page.width - 100,
        });
    }
  }
}

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

    // Obtener ítems de la nota de crédito
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
