function paginacionFacturasCliente(query = {}) {
  const limitRaw = parseInt(query.limit, 10);
  const pageRaw = parseInt(query.page, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 5;
  const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
  return { limit, page, offset: (page - 1) * limit };
}

module.exports = { paginacionFacturasCliente };
