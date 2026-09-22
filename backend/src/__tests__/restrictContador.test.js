const { esContador, puedeAccederErp } = require("../utils/permisos");
const { rutaPermitidaContador } = require("../middleware/restrictContador");

describe("puedeAccederErp", () => {
  it("deja entrar a admin, contador y superadm por permiso", () => {
    expect(puedeAccederErp("admin")).toBe(true);
    expect(puedeAccederErp("contador")).toBe(true);
    expect(puedeAccederErp("superadm")).toBe(true);
    expect(puedeAccederErp("SUPERADM")).toBe(true);
  });

  it("deja entrar al vendedor con codigo superadm aunque Permisos esté vacío", () => {
    expect(puedeAccederErp("", "superadm")).toBe(true);
    expect(puedeAccederErp(null, "admin")).toBe(true);
    expect(puedeAccederErp("", "juan")).toBe(false);
  });

  it("deja iniciar sesión al cajero y se la niega al vendedor", () => {
    const { puedeIniciarSesion } = require("../utils/permisos");
    expect(puedeIniciarSesion("cajero", "caja1")).toBe(true);
    expect(puedeIniciarSesion("vendor", "vend1")).toBe(false);
    expect(puedeAccederErp("cajero", "caja1")).toBe(false);
  });
});

describe("esContador / rutaPermitidaContador", () => {
  it("reconoce contador ignorando mayúsculas y espacios", () => {
    expect(esContador("contador")).toBe(true);
    expect(esContador("CONTADOR")).toBe(true);
    expect(esContador("admin")).toBe(false);
    expect(esContador("vendor")).toBe(false);
  });

  it("permite GET de informes y catálogos usados por las pantallas", () => {
    expect(rutaPermitidaContador("GET", "/api/informes/iva/facturas")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/informes/facturacion?fechaDesde=2026-01-01")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/tipos-pago")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/categorias-iva")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/vendedores")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/datos-empresa")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/articulos?search=aceite")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/rubros?limit=1000")).toBe(true);
    expect(rutaPermitidaContador("GET", "/api/proveedores?limit=1000")).toBe(true);
    expect(rutaPermitidaContador("POST", "/api/auth/logout")).toBe(true);
  });

  it("bloquea el resto de APIs y el export automático", () => {
    expect(rutaPermitidaContador("GET", "/api/facturas")).toBe(false);
    expect(rutaPermitidaContador("POST", "/api/facturas")).toBe(false);
    expect(rutaPermitidaContador("POST", "/api/informes/ventas-rubros-provincia/export-auto")).toBe(false);
    expect(rutaPermitidaContador("GET", "/api/dashboard/resumen-dia")).toBe(false);
    expect(rutaPermitidaContador("GET", "/api/caja")).toBe(false);
  });
});
