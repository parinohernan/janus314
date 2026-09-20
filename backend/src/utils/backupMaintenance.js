const restoring = new Set();

function empresaKey(empresaId) {
  return String(empresaId || '');
}

function enterRestore(empresaId) {
  restoring.add(empresaKey(empresaId));
}

function leaveRestore(empresaId) {
  restoring.delete(empresaKey(empresaId));
}

function isRestoring(empresaId) {
  return restoring.has(empresaKey(empresaId));
}

function isBackupApiPath(originalUrl) {
  const pathOnly = String(originalUrl || '').split('?')[0];
  return pathOnly === '/api/backups' || pathOnly.startsWith('/api/backups/');
}

function resetForTests() {
  restoring.clear();
}

module.exports = {
  enterRestore,
  leaveRestore,
  isRestoring,
  isBackupApiPath,
  resetForTests
};
