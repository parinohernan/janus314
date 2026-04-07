import { k as attr, c as pop, p as push, d as store_get, u as unsubscribe_stores, e as escape_html } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { B as Button } from "../../../../../chunks/Button.js";
import { a as auth } from "../../../../../chunks/authStore.js";
import "../../../../../chunks/navigationState.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let articulosPorRubro, articulosPorRubroOrdenado;
  let articulos = [];
  let rubros = [];
  let loading = true;
  let listaPrecio = "1";
  let mostrarExistencia = true;
  let soloActivos = true;
  let configuracionRubros = [];
  function getStorageKey() {
    const userId = store_get($$store_subs ??= {}, "$auth", auth).user?.usuario || "anonymous";
    return `listadoPreciosConfig_${userId}`;
  }
  function guardarConfiguracionRubros() {
    if (typeof window !== "undefined") {
      const config = {
        configuracionRubros,
        listaPrecio,
        mostrarExistencia,
        soloActivos,
        ultimaActualizacion: (/* @__PURE__ */ new Date()).toISOString(),
        usuario: store_get($$store_subs ??= {}, "$auth", auth).user?.usuario || "anonymous"
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(config));
    }
  }
  function crearConfiguracionPorDefecto() {
    if (configuracionRubros.length === 0 && rubros.length > 0) {
      const rubrosOrdenados = [
        ...rubros.map((r) => r.Codigo).sort(),
        "SIN_RUBRO"
      ];
      configuracionRubros = rubrosOrdenados.map((codigo, index) => ({ codigo, visible: true, orden: index }));
      guardarConfiguracionRubros();
    }
  }
  articulosPorRubro = articulos.reduce(
    (acc, articulo) => {
      const rubroCodigo = articulo.RubroCodigo || "SIN_RUBRO";
      const configRubro = configuracionRubros.find((c) => c.codigo === rubroCodigo);
      if (configRubro && configRubro.visible) {
        if (!acc[rubroCodigo]) {
          acc[rubroCodigo] = [];
        }
        acc[rubroCodigo].push(articulo);
      }
      return acc;
    },
    {}
  );
  if (configuracionRubros.length > 0) {
    articulosPorRubro = articulosPorRubro;
  }
  articulosPorRubroOrdenado = (() => {
    const resultado = [];
    const configuracionOrdenada = [...configuracionRubros].sort((a, b) => a.orden - b.orden);
    for (const config of configuracionOrdenada) {
      if (config.visible && articulosPorRubro[config.codigo]) {
        resultado.push({
          codigo: config.codigo,
          articulos: articulosPorRubro[config.codigo]
        });
      }
    }
    return resultado;
  })();
  if (configuracionRubros.length > 0) {
    console.log("Configuración completa:", configuracionRubros.map((c) => `${c.codigo}: visible=${c.visible}, orden=${c.orden}`));
    console.log("Rubros visibles en el listado:", Object.keys(articulosPorRubro));
    console.log("Orden final en articulosPorRubroOrdenado:", articulosPorRubroOrdenado.map((r) => r.codigo));
  }
  if (rubros.length > 0 && configuracionRubros.length === 0) {
    crearConfiguracionPorDefecto();
  }
  if (typeof window !== "undefined" && configuracionRubros.length > 0) {
    guardarConfiguracionRubros();
  }
  $$payload.out += `<div class="container mx-auto px-4 py-6 svelte-1sbzb86"><h1 class="text-2xl font-bold mb-6 svelte-1sbzb86">Listado de Precios</h1> <div class="bg-white rounded-lg shadow-md p-4 mb-6 svelte-1sbzb86"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 svelte-1sbzb86"><div class="svelte-1sbzb86"><label for="listaPrecio" class="block text-sm font-medium text-gray-700 mb-2 svelte-1sbzb86">Lista de Precios</label> <select id="listaPrecio" class="w-full border border-gray-300 rounded-md shadow-sm p-2 svelte-1sbzb86"><option value="1" class="svelte-1sbzb86">Lista 1</option><option value="2" class="svelte-1sbzb86">Lista 2</option><option value="3" class="svelte-1sbzb86">Lista 3</option><option value="4" class="svelte-1sbzb86">Lista 4</option><option value="5" class="svelte-1sbzb86">Lista 5</option></select></div> <div class="flex items-end svelte-1sbzb86"><label class="inline-flex items-center svelte-1sbzb86"><input type="checkbox"${attr("checked", mostrarExistencia, true)} class="form-checkbox h-5 w-5 text-indigo-600 svelte-1sbzb86"> <span class="ml-2 text-gray-700 svelte-1sbzb86">Mostrar existencia</span></label></div> <div class="flex items-end svelte-1sbzb86"><label class="inline-flex items-center svelte-1sbzb86"><input type="checkbox"${attr("checked", soloActivos, true)} class="form-checkbox h-5 w-5 text-indigo-600 svelte-1sbzb86"> <span class="ml-2 text-gray-700 svelte-1sbzb86">Solo activos</span></label></div> <div class="flex items-end space-x-2 svelte-1sbzb86">`;
  Button($$payload, {
    variant: "primary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Descargar PDF")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Compartir`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "secondary",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Imprimir`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></div></div> <div class="bg-white rounded-lg shadow-md p-4 mb-6 svelte-1sbzb86"><div class="flex justify-between items-center mb-4 svelte-1sbzb86"><h3 class="text-lg font-semibold text-gray-800 svelte-1sbzb86">Configuración de Rubros</h3> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html("Configurar")} Rubros`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center h-48 svelte-1sbzb86"><div class="spinner svelte-1sbzb86"></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
