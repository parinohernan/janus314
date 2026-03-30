/**
 * Carpeta Cloudinary por tenant: remitos/{empresaId} (id del JWT).
 */
function sanitizeEmpresaIdSegment(empresaId) {
  if (empresaId == null || empresaId === '') return null;
  const idSegment = String(empresaId).replace(/[^\w-]/g, '').slice(0, 64);
  return idSegment || null;
}

function remitosFolderFromEmpresaId(empresaId) {
  const seg = sanitizeEmpresaIdSegment(empresaId);
  return seg ? `remitos/${seg}` : null;
}

module.exports = {
  sanitizeEmpresaIdSegment,
  remitosFolderFromEmpresaId
};
