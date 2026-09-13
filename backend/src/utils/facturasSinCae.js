const { Op } = require("sequelize");

const TIPOS_FACTURA_CON_CAE = ["FCA", "FCB", "FCC"];
const TIPOS_NC_CON_CAE = ["NCA", "NCB"];

function whereSinCae(tipos) {
  return {
    DocumentoTipo: { [Op.in]: tipos },
    FechaAnulacion: null,
    [Op.or]: [{ afip_cae: null }, { afip_cae: "" }],
  };
}

function whereFacturasSinCae() {
  return whereSinCae(TIPOS_FACTURA_CON_CAE);
}

function whereNotasCreditoSinCae() {
  return whereSinCae(TIPOS_NC_CON_CAE);
}

function mapearComprobanteSinCae(row, clase) {
  const plain = typeof row?.toJSON === "function" ? row.toJSON() : row;
  return {
    clase,
    tipo: plain.DocumentoTipo,
    sucursal: plain.DocumentoSucursal,
    numero: plain.DocumentoNumero,
    fecha: plain.Fecha,
    importe: Number(plain.ImporteTotal) || 0,
    cliente: plain.Cliente?.Descripcion || "Sin cliente",
  };
}

module.exports = {
  TIPOS_FACTURA_CON_CAE,
  TIPOS_NC_CON_CAE,
  whereFacturasSinCae,
  whereNotasCreditoSinCae,
  mapearComprobanteSinCae,
};
