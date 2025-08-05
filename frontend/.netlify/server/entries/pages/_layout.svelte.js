import { d as store_get, u as unsubscribe_stores, c as pop, p as push } from "../../chunks/index3.js";
/* empty css               */
import "../../chunks/authStore.js";
import "clsx";
import "../../chunks/client.js";
import { p as page } from "../../chunks/stores.js";
import { w as writable } from "../../chunks/index2.js";
import "../../chunks/navigationState.js";
const availableFeatures = [
  // Ventas
  { id: "nueva-factura", label: "Nueva Factura", url: "/ventas/facturas/nueva", icon: "📄", category: "Ventas" },
  { id: "facturas", label: "Facturas", url: "/ventas/facturas", icon: "📋", category: "Ventas" },
  { id: "nuevo-recibo", label: "Nuevo Recibo", url: "/ventas/recibos/nueva", icon: "💰", category: "Ventas" },
  { id: "recibos", label: "Recibos", url: "/ventas/recibos", icon: "📊", category: "Ventas" },
  { id: "nueva-nota-credito", label: "Nueva Nota de Crédito", url: "/ventas/notascredito/nueva", icon: "📝", category: "Ventas" },
  { id: "notas-credito", label: "Notas de Crédito", url: "/ventas/notascredito", icon: "📋", category: "Ventas" },
  { id: "preventas", label: "Preventas", url: "/ventas/preventas", icon: "🛒", category: "Ventas" },
  { id: "descargar-preventas", label: "Descargar Preventas", url: "/sincronizacion/preventas", icon: "⬇️", category: "Ventas" },
  { id: "presupuestos", label: "Presupuestos", url: "/ventas/presupuestos", icon: "📋", category: "Ventas" },
  { id: "informes-facturacion", label: "Informes - Facturación", url: "/ventas/informes/facturacion", icon: "📊", category: "Ventas" },
  { id: "informes-productos", label: "Informes - Productos", url: "/ventas/informes/productos", icon: "📦", category: "Ventas" },
  { id: "informes-clientes", label: "Informes - Clientes", url: "/ventas/informes/clientes", icon: "👥", category: "Ventas" },
  { id: "informes-vendedores", label: "Informes - Vendedores", url: "/ventas/informes/vendedores", icon: "👨‍💼", category: "Ventas" },
  // Productos
  { id: "productos", label: "Productos", url: "/productos", icon: "📦", category: "Productos" },
  { id: "stock", label: "Stock", url: "/productos/stock", icon: "📊", category: "Productos" },
  { id: "rubros", label: "Rubros", url: "/rubros", icon: "🏷️", category: "Productos" },
  { id: "listado-precios", label: "Listado de Precios", url: "/productos/precios/listado", icon: "💰", category: "Productos" },
  { id: "actualizacion-precios", label: "Actualización de Precios", url: "/productos/precios/actualizacion", icon: "📈", category: "Productos" },
  { id: "actualizacion-precios-listas", label: "Actualización de Precios desde listas", url: "/productos/precios/actualizarconlista", icon: "📋", category: "Productos" },
  // Clientes
  { id: "clientes", label: "Clientes", url: "/clientes", icon: "👥", category: "Clientes" },
  { id: "cuentas-corrientes", label: "Cuentas Corrientes", url: "/clientes/cuentascorrientes", icon: "💳", category: "Clientes" },
  // Compras
  { id: "proveedores", label: "Proveedores", url: "/compras/proveedores", icon: "🏢", category: "Compras" },
  // General
  { id: "empresa", label: "Mi Empresa", url: "/empresa", icon: "🏢", category: "General" },
  { id: "arca", label: "Estado ARCA", url: "/arca", icon: "📊", category: "General" },
  { id: "localidades", label: "Localidades", url: "/localidades", icon: "📍", category: "General" },
  { id: "provincias", label: "Provincias", url: "/provincias", icon: "🗺️", category: "General" },
  // Caja
  { id: "caja-admin", label: "Administración de Caja", url: "/ventas/bot/caja", icon: "💼", category: "Caja" },
  { id: "cajas-cerradas", label: "Cajas Cerradas", url: "/ventas/bot/caja/cerradas", icon: "🔒", category: "Caja" },
  { id: "arqueo", label: "Arqueo", url: "/ventas/bot/caja/arqueo", icon: "💰", category: "Caja" },
  { id: "ingresos", label: "Ingresos", url: "/ventas/bot/caja/ingreso", icon: "➕", category: "Caja" },
  { id: "egresos", label: "Egresos", url: "/ventas/bot/caja/egreso", icon: "➖", category: "Caja" },
  // Sincronización
  { id: "sincronizacion", label: "Sincronizar Móviles", url: "/sincronizacion", icon: "📱", category: "Sincronización" },
  { id: "actualizar-datos", label: "Actualizar Datos", url: "/sincronizacion/actualizar-datos", icon: "🔄", category: "Sincronización" },
  { id: "configuracion-sincronizacion", label: "Configuración", url: "/sincronizacion/configuracion", icon: "⚙️", category: "Sincronización" }
];
function createFavoritesStore() {
  const { subscribe, set, update } = writable([]);
  function loadFavorites() {
  }
  function addFavorite(favorite) {
    update((favorites) => {
      if (!favorites.find((f) => f.id === favorite.id)) {
        const newFavorites = [...favorites, favorite];
        return newFavorites;
      }
      return favorites;
    });
  }
  function removeFavorite(id) {
    update((favorites) => {
      const newFavorites = favorites.filter((f) => f.id !== id);
      return newFavorites;
    });
  }
  function clearFavorites() {
    set([]);
  }
  function getAvailableFeatures(favorites) {
    return availableFeatures.filter(
      (f) => !favorites.find((fav) => fav.id === f.id)
    );
  }
  function groupByCategory(favorites) {
    return favorites.reduce((acc, favorite) => {
      if (!acc[favorite.category]) {
        acc[favorite.category] = [];
      }
      acc[favorite.category].push(favorite);
      return acc;
    }, {});
  }
  return {
    subscribe,
    loadFavorites,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getAvailableFeatures,
    groupByCategory
  };
}
createFavoritesStore();
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let { children } = $$props;
  store_get($$store_subs ??= {}, "$page", page).url.pathname.includes("/ventas/bot/");
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex items-center justify-center h-screen"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
