import { h as head, e as escape_html, m as attr_class, k as attr, l as ensure_array_like, c as pop, p as push, u as unsubscribe_stores, d as store_get, n as stringify } from "../../../../chunks/index3.js";
import { B as Button } from "../../../../chunks/Button.js";
import { a as auth } from "../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let opcionesGrupo, etiquetaSeleccion, articulosFiltrados, articulosPorGrupo, articulosPorGrupoOrdenado;
  let articulos = [];
  let rubros = [];
  let loading = true;
  let soloActivos = true;
  let soloStockBajo = false;
  let mostrarSinStock = true;
  let agrupamiento = "rubro";
  let gruposSeleccionados = /* @__PURE__ */ new Set();
  let busquedaGrupo = "";
  function getStorageKey() {
    const userId = store_get($$store_subs ??= {}, "$auth", auth).user?.usuario || "anonymous";
    return `existenciaConfig_v2_${agrupamiento}_${userId}`;
  }
  function guardarConfiguracion() {
    if (typeof window !== "undefined") {
      const config = {
        seleccionados: Array.from(gruposSeleccionados),
        soloActivos,
        soloStockBajo,
        mostrarSinStock,
        agrupamiento,
        ultimaActualizacion: (/* @__PURE__ */ new Date()).toISOString()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(config));
    }
  }
  opcionesGrupo = (() => {
    const opciones = [];
    {
      for (const r of rubros) {
        opciones.push({ codigo: r.Codigo, descripcion: r.Descripcion });
      }
      opciones.push({ codigo: "SIN_RUBRO", descripcion: "Sin Rubro" });
    }
    return opciones.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  })();
  busquedaGrupo.trim() ? opcionesGrupo.filter((o) => o.descripcion.toLowerCase().includes(busquedaGrupo.toLowerCase()) || o.codigo.toLowerCase().includes(busquedaGrupo.toLowerCase())) : opcionesGrupo;
  etiquetaSeleccion = (() => {
    if (gruposSeleccionados.size === 0) return "Ninguno seleccionado";
    if (gruposSeleccionados.size === opcionesGrupo.length) return "Todos";
    return `${gruposSeleccionados.size} de ${opcionesGrupo.length}`;
  })();
  articulosFiltrados = articulos.filter((a) => {
    return true;
  });
  articulosPorGrupo = articulosFiltrados.reduce(
    (acc, articulo) => {
      const grupoCodigo = articulo.RubroCodigo || "SIN_RUBRO";
      if (gruposSeleccionados.has(grupoCodigo)) {
        if (!acc[grupoCodigo]) {
          acc[grupoCodigo] = [];
        }
        acc[grupoCodigo].push(articulo);
      }
      return acc;
    },
    {}
  );
  articulosPorGrupoOrdenado = opcionesGrupo.filter((o) => gruposSeleccionados.has(o.codigo) && articulosPorGrupo[o.codigo]).map((o) => ({
    codigo: o.codigo,
    articulos: articulosPorGrupo[o.codigo]
  }));
  articulosPorGrupoOrdenado.reduce((sum, g) => sum + g.articulos.length, 0);
  articulosFiltrados.length;
  articulosFiltrados.filter((a) => (a.Existencia || 0) === 0).length;
  articulosFiltrados.filter((a) => {
    const e = a.Existencia || 0;
    const m = a.ExistenciaMinima || 0;
    return e > 0 && e <= m;
  }).length;
  articulosFiltrados.filter((a) => {
    const e = a.Existencia || 0;
    const m = a.ExistenciaMinima || 0;
    return e > m;
  }).length;
  if (typeof window !== "undefined" && gruposSeleccionados.size > 0) {
    guardarConfiguracion();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Resumen de Existencia</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-6 svelte-enml0b"><h1 class="text-2xl font-bold mb-6 svelte-enml0b">Resumen de Existencia</h1> <div class="bg-white rounded-lg shadow-md p-4 mb-6 svelte-enml0b"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 svelte-enml0b"><div class="svelte-enml0b"><label for="agrupamiento" class="block text-sm font-medium text-gray-700 mb-2 svelte-enml0b">Agrupar por</label> <select id="agrupamiento" class="w-full border border-gray-300 rounded-md shadow-sm p-2 svelte-enml0b"><option value="rubro" class="svelte-enml0b">Rubro</option><option value="proveedor" class="svelte-enml0b">Proveedor</option></select></div> <div class="svelte-enml0b"><span class="block text-sm font-medium text-gray-700 mb-2 svelte-enml0b">${escape_html("Rubros")}</span> <div class="relative svelte-enml0b"><button type="button" class="w-full flex items-center justify-between border border-gray-300 rounded-md shadow-sm p-2 bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 svelte-enml0b"><span class="text-sm text-gray-700 truncate svelte-enml0b">${escape_html(etiquetaSeleccion)}</span> <svg${attr_class(`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${stringify("")}`, "svelte-enml0b")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" class="svelte-enml0b"></path></svg></button> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="flex items-end space-x-2 svelte-enml0b">`;
  Button($$payload, {
    variant: "primary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Ver PDF")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Descargar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div> <div class="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100 svelte-enml0b"><label class="inline-flex items-center svelte-enml0b"><input type="checkbox"${attr("checked", soloActivos, true)} class="form-checkbox h-4 w-4 text-indigo-600 svelte-enml0b"> <span class="ml-2 text-sm text-gray-700 svelte-enml0b">Solo activos</span></label> <label class="inline-flex items-center svelte-enml0b"><input type="checkbox"${attr("checked", soloStockBajo, true)} class="form-checkbox h-4 w-4 text-yellow-600 svelte-enml0b"> <span class="ml-2 text-sm text-gray-700 svelte-enml0b">Solo stock bajo / sin stock</span></label> <label class="inline-flex items-center svelte-enml0b"><input type="checkbox"${attr("checked", mostrarSinStock, true)} class="form-checkbox h-4 w-4 text-red-600 svelte-enml0b"> <span class="ml-2 text-sm text-gray-700 svelte-enml0b">Mostrar sin stock</span></label></div> `;
  if (gruposSeleccionados.size > 0 && gruposSeleccionados.size < opcionesGrupo.length) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(opcionesGrupo.filter((o) => gruposSeleccionados.has(o.codigo)));
    $$payload.out += `<div class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 svelte-enml0b"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let opcion = each_array_1[$$index_1];
      $$payload.out += `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs svelte-enml0b">${escape_html(opcion.descripcion)} <button type="button" class="text-indigo-400 hover:text-indigo-700 font-bold leading-none svelte-enml0b">×</button></span>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center h-48 svelte-enml0b"><div class="spinner svelte-enml0b"></div></div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
