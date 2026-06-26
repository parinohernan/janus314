const { Op } = require("sequelize");

async function resolverLocalidadDesdeCodigoPostal(codigoPostal, LocalidadModel) {
  const codigo = String(codigoPostal || "").trim();
  if (!codigo) return null;
  const row = await LocalidadModel.findByPk(codigo, {
    attributes: ["Descripcion"],
    raw: true,
  });
  return row?.Descripcion?.trim() || null;
}

async function aplicarLocalidadDesdeCodigoPostal(clienteData, LocalidadModel) {
  const descripcion = await resolverLocalidadDesdeCodigoPostal(
    clienteData.CodigoPostal,
    LocalidadModel
  );
  if (descripcion) {
    clienteData.Localidad = descripcion;
  }
  return clienteData;
}

async function enriquecerClienteLocalidad(cliente, LocalidadModel) {
  if (!cliente) return cliente;
  const codigoPostal = cliente.get ? cliente.get("CodigoPostal") : cliente.CodigoPostal;
  const descripcion = await resolverLocalidadDesdeCodigoPostal(codigoPostal, LocalidadModel);
  if (descripcion) {
    if (cliente.set) cliente.set("Localidad", descripcion);
    else cliente.Localidad = descripcion;
  }
  return cliente;
}

async function enriquecerLocalidadEnClientes(clientes, LocalidadModel) {
  if (!clientes?.length) return clientes;

  const codigos = [
    ...new Set(
      clientes
        .map((c) => (c.get ? c.get("CodigoPostal") : c.CodigoPostal))
        .filter((cp) => cp && String(cp).trim() !== "")
    ),
  ];
  if (codigos.length === 0) return clientes;

  const localidades = await LocalidadModel.findAll({
    where: { Codigo: { [Op.in]: codigos } },
    attributes: ["Codigo", "Descripcion"],
    raw: true,
  });
  const porCodigo = Object.fromEntries(
    localidades.map((l) => [l.Codigo, l.Descripcion])
  );

  for (const cliente of clientes) {
    const cp = cliente.get ? cliente.get("CodigoPostal") : cliente.CodigoPostal;
    const desc = cp ? porCodigo[cp] : null;
    if (desc) {
      if (cliente.set) cliente.set("Localidad", desc);
      else cliente.Localidad = desc;
    }
  }
  return clientes;
}

module.exports = {
  resolverLocalidadDesdeCodigoPostal,
  aplicarLocalidadDesdeCodigoPostal,
  enriquecerClienteLocalidad,
  enriquecerLocalidadEnClientes,
};
