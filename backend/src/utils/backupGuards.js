function assertConfirmName(empresaNombre, confirmName) {
  if (String(confirmName || '').trim() !== String(empresaNombre || '').trim()) {
    const err = new Error('El nombre de la empresa no coincide. Escribí el nombre exacto para confirmar.');
    err.status = 400;
    throw err;
  }
}

module.exports = { assertConfirmName };
