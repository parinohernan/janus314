const { Op } = require("sequelize");

const TIPOS_FACTURA_IVA = ["FCA", "FCB", "FCC"];
const TIPOS_NC_IVA = ["NCA", "NCB"];

const INSCRIPCION_POR_CODIGO = {
  I: "Resp. inscripto",
  M: "Monotributo",
  E: "Exento",
  F: "Cons. final",
};

function formatearCuit(cuit) {
  const digits = String(cuit || "").replace(/\D/g, "");
  if (digits.length !== 11) {
    return cuit ? String(cuit).trim() : "";
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

function inscripcionDesdeCategoria(codigo, descripcion) {
  const codigoNorm = String(codigo || "").trim().toUpperCase();
  if (INSCRIPCION_POR_CODIGO[codigoNorm]) {
    return INSCRIPCION_POR_CODIGO[codigoNorm];
  }
  const texto = String(descripcion || "").toUpperCase();
  if (texto.includes("MONOTR")) return "Monotributo";
  if (texto.includes("EXENT")) return "Exento";
  if (texto.includes("FINAL")) return "Cons. final";
  if (texto.includes("INSCRIP") || texto.includes("RESPONSABLE")) {
    return "Resp. inscripto";
  }
  return descripcion || "";
}

function ivaOVacio(valor) {
  const n = Number(valor) || 0;
  return n === 0 ? null : n;
}

function mapearComprobanteIva(row, categoriasMap = {}) {
  const plain = typeof row?.toJSON === "function" ? row.toJSON() : row;
  const cliente = plain.Cliente || {};
  const codigoCat = cliente.CategoriaIva || "";
  const catDesc =
    categoriasMap[codigoCat] ||
    cliente.CategoriaIvaRelacion?.Descripcion ||
    "";

  return {
    fecha: plain.Fecha,
    tipo: plain.DocumentoTipo,
    sucursal: plain.DocumentoSucursal,
    numero: String(plain.DocumentoNumero || "").padStart(8, "0"),
    cliente: cliente.Descripcion || "Sin cliente",
    importe: Number(plain.ImporteTotal) || 0,
    iva105: ivaOVacio(plain.ImporteIva2),
    iva21: ivaOVacio(plain.ImporteIva1),
    inscripcion: inscripcionDesdeCategoria(codigoCat, catDesc),
    idTributario: "CUIT",
    cuit: formatearCuit(cliente.Cuit),
  };
}

function sumarTotales(comprobantes) {
  return comprobantes.reduce(
    (acc, item) => {
      acc.cantidad += 1;
      acc.importe += Number(item.importe) || 0;
      acc.iva105 += Number(item.iva105) || 0;
      acc.iva21 += Number(item.iva21) || 0;
      return acc;
    },
    { cantidad: 0, importe: 0, iva105: 0, iva21: 0 }
  );
}

async function obtenerInformeIvaComprobantes({
  models,
  clase,
  fechaDesde,
  fechaHasta,
}) {
  const { FacturaCabeza, NotaCredito, Cliente, CategoriaIva } = models || {};
  const esNc = clase === "notaCredito";
  const Model = esNc ? NotaCredito : FacturaCabeza;
  const tipos = esNc ? TIPOS_NC_IVA : TIPOS_FACTURA_IVA;

  if (!Model) {
    throw new Error("Modelo no disponible");
  }

  const categorias = CategoriaIva
    ? await CategoriaIva.findAll({
        attributes: ["Codigo", "Descripcion"],
        raw: true,
      })
    : [];
  const categoriasMap = Object.fromEntries(
    categorias.map((cat) => [cat.Codigo, cat.Descripcion])
  );

  const includeCliente = Cliente
    ? [
        {
          model: Cliente,
          attributes: ["Codigo", "Descripcion", "Cuit", "CategoriaIva"],
          required: false,
        },
      ]
    : [];

  const rows = await Model.findAll({
    where: {
      Fecha: { [Op.between]: [fechaDesde, fechaHasta] },
      FechaAnulacion: null,
      DocumentoTipo: { [Op.in]: tipos },
    },
    attributes: [
      "DocumentoTipo",
      "DocumentoSucursal",
      "DocumentoNumero",
      "Fecha",
      "ImporteTotal",
      "ImporteIva1",
      "ImporteIva2",
    ],
    include: includeCliente,
    order: [
      ["Fecha", "ASC"],
      ["DocumentoTipo", "ASC"],
      ["DocumentoSucursal", "ASC"],
      ["DocumentoNumero", "ASC"],
    ],
  });

  const comprobantes = rows.map((row) => mapearComprobanteIva(row, categoriasMap));
  return {
    comprobantes,
    totales: sumarTotales(comprobantes),
  };
}

module.exports = {
  TIPOS_FACTURA_IVA,
  TIPOS_NC_IVA,
  formatearCuit,
  inscripcionDesdeCategoria,
  ivaOVacio,
  mapearComprobanteIva,
  sumarTotales,
  obtenerInformeIvaComprobantes,
};
