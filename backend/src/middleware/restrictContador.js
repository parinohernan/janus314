const { esContador } = require("../utils/permisos");

const CATALOGOS_GET = [
  "/api/tipos-pago",
  "/api/categorias-iva",
  "/api/vendedores",
  "/api/datos-empresa",
  "/api/articulos",
  "/api/rubros",
  "/api/proveedores",
];

function pathSinQuery(originalUrl) {
  return String(originalUrl || "").split("?")[0];
}

function pathEmpiezaCon(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function rutaPermitidaContador(method, originalUrl) {
  const path = pathSinQuery(originalUrl);
  const metodo = String(method || "GET").toUpperCase();

  if (pathEmpiezaCon(path, "/api/auth")) {
    return true;
  }
  if (pathEmpiezaCon(path, "/api/informes") && metodo === "GET") {
    return true;
  }
  if (metodo !== "GET") {
    return false;
  }
  return CATALOGOS_GET.some((prefix) => pathEmpiezaCon(path, prefix));
}

function restrictContador(req, res, next) {
  const permisos = req.userData?.permisos;
  if (!esContador(permisos)) {
    return next();
  }

  const originalUrl = req.originalUrl || req.url || "";
  if (rutaPermitidaContador(req.method, originalUrl)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: "Acceso denegado. El rol contador solo puede consultar informes.",
  });
}

module.exports = restrictContador;
module.exports.rutaPermitidaContador = rutaPermitidaContador;
