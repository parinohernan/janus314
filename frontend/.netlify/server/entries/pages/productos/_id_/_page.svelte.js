import { d as store_get, g as ensure_array_like, h as head, e as escape_html, j as attr, u as unsubscribe_stores, c as pop, p as push } from "../../../../chunks/index3.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/client.js";
import { B as Button } from "../../../../chunks/Button.js";
import { f as fetchWithAuth } from "../../../../chunks/fetchWithAuth.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
  let articulo = {
    Codigo: "",
    Descripcion: "",
    Existencia: 0,
    ExistenciaMinima: 0,
    ExistenciaMaxima: 0,
    PrecioCostoMasImp: 0,
    PorcentajeIVA1: 21,
    // Valor predeterminado para Argentina
    PorcentajeIVA2: 0,
    PrecioCosto: 0,
    UnidadVenta: "",
    Lista1: 0,
    Lista2: 0,
    Lista3: 0,
    Lista4: 0,
    Lista5: 0,
    ProveedorCodigo: "",
    RubroCodigo: "",
    Peso: 0,
    SiempreSeDescarga: 0,
    Iva2SobreNeto: 0,
    PorcentajeVendedor: 0,
    DescuentoXCantidad: "",
    SeVende: 1,
    Activo: 1,
    EnviadoACentral: 0,
    RequiereFrio: 0,
    FamiliaCodigo: "",
    SubFamiliaCodigo: "",
    ProveedorArticuloCodigo: "",
    EsCompuesto: 0,
    UV_OrdenDeEntrega: "",
    UbicacionDeposito: "",
    CodigoBarras: ""
  };
  let proveedores = [];
  let rubros = [];
  let loading = false;
  let error = null;
  if (store_get($$store_subs ??= {}, "$page", page).params.id) {
    isEditing = store_get($$store_subs ??= {}, "$page", page).params.id !== "nuevo";
    if (isEditing) {
      (async () => {
        try {
          loading = true;
          const response = await fetchWithAuth(`/articulos/${store_get($$store_subs ??= {}, "$page", page).params.id}`);
          if (!response.ok) {
            throw new Error("Error al cargar el artículo");
          }
          articulo = await response.json();
        } catch (err) {
          console.error("Error cargando artículo:", err);
          if (err instanceof Error) {
            error = err.message;
          } else {
            error = "Error desconocido";
          }
        } finally {
          loading = false;
        }
      })();
    }
  }
  const each_array = ensure_array_like(proveedores);
  const each_array_1 = ensure_array_like(rubros);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(isEditing ? "Editar" : "Nuevo")} Producto</title>`;
  });
  $$payload.out += `<div class="container mx-auto p-4"><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">${escape_html(isEditing ? "Editar" : "Nuevo")} Producto</h1> `;
  Button($$payload, {
    variant: "secondary",
    children: ($$payload2) => {
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg> Volver a productos`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> `;
  if (error && isEditing) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">${escape_html(error)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form><div class="space-y-6"><div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Datos principales</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="codigo" class="block text-sm font-medium text-gray-700 mb-1">Código *</label> <input type="text" id="codigo"${attr("value", articulo.Codigo)} required${attr("disabled", isEditing, true)} maxlength="13" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></div> <div><label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label> <input type="text" id="descripcion"${attr("value", articulo.Descripcion)} required maxlength="200" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="codigoBarras" class="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label> <input type="text" id="codigoBarras"${attr("value", articulo.CodigoBarras)} maxlength="20" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="proveedorArticuloCodigo" class="block text-sm font-medium text-gray-700 mb-1">Código Artículo Proveedor</label> <input type="text" id="proveedorArticuloCodigo"${attr("value", articulo.ProveedorArticuloCodigo)} maxlength="20" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Clasificación</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label for="proveedor" class="block text-sm font-medium text-gray-700 mb-1">Proveedor</label> <select id="proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccione proveedor</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let proveedor = each_array[$$index];
    $$payload.out += `<option${attr("value", proveedor.Codigo)}>${escape_html(proveedor.Descripcion)} (${escape_html(proveedor.Codigo)})</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="rubro" class="block text-sm font-medium text-gray-700 mb-1">Rubro</label> <select id="rubro" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Seleccione rubro</option><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let rubro = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", rubro.Codigo)}>${escape_html(rubro.Descripcion)} (${escape_html(rubro.Codigo)})</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div><label for="familia" class="block text-sm font-medium text-gray-700 mb-1">Familia</label> <input type="text" id="familia"${attr("value", articulo.FamiliaCodigo)} maxlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="subfamilia" class="block text-sm font-medium text-gray-700 mb-1">Subfamilia</label> <input type="text" id="subfamilia"${attr("value", articulo.SubFamiliaCodigo)} maxlength="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Existencias</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label for="existencia" class="block text-sm font-medium text-gray-700 mb-1">Existencia Actual</label> <input type="number" id="existencia"${attr("value", articulo.Existencia)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="existenciaMinima" class="block text-sm font-medium text-gray-700 mb-1">Existencia Mínima</label> <input type="number" id="existenciaMinima"${attr("value", articulo.ExistenciaMinima)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="existenciaMaxima" class="block text-sm font-medium text-gray-700 mb-1">Existencia Máxima</label> <input type="number" id="existenciaMaxima"${attr("value", articulo.ExistenciaMaxima)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="ubicacionDeposito" class="block text-sm font-medium text-gray-700 mb-1">Ubicación en Depósito</label> <input type="text" id="ubicacionDeposito"${attr("value", articulo.UbicacionDeposito)} maxlength="100" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="peso" class="block text-sm font-medium text-gray-700 mb-1">Peso</label> <input type="number" id="peso"${attr("value", articulo.Peso)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="unidadVenta" class="block text-sm font-medium text-gray-700 mb-1">Unidad de Venta</label> <input type="text" id="unidadVenta"${attr("value", articulo.UnidadVenta)} maxlength="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Precios y Costos</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label for="precioCosto" class="block text-sm font-medium text-gray-700 mb-1">Precio Costo (sin IVA)</label> <input type="number" id="precioCosto"${attr("value", articulo.PrecioCosto)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="precioCostoMasImp" class="block text-sm font-medium text-gray-700 mb-1">Precio Costo (con IVA)</label> <input type="number" id="precioCostoMasImp"${attr("value", articulo.PrecioCostoMasImp)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="porcentajeIVA1" class="block text-sm font-medium text-gray-700 mb-1">Porcentaje IVA 1</label> <input type="number" id="porcentajeIVA1"${attr("value", articulo.PorcentajeIVA1)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="porcentajeIVA2" class="block text-sm font-medium text-gray-700 mb-1">Porcentaje IVA 2</label> <input type="number" id="porcentajeIVA2"${attr("value", articulo.PorcentajeIVA2)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div> `;
  Button($$payload, {
    type: "button",
    variant: "secondary",
    class: "mb-4",
    children: ($$payload2) => {
      $$payload2.out += `<!---->Actualizar Listas de Precios`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label for="lista1" class="block text-sm font-medium text-gray-700 mb-1">Precio Lista 1</label> <input type="number" id="lista1"${attr("value", articulo.Lista1)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="lista2" class="block text-sm font-medium text-gray-700 mb-1">Precio Lista 2</label> <input type="number" id="lista2"${attr("value", articulo.Lista2)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="lista3" class="block text-sm font-medium text-gray-700 mb-1">Precio Lista 3</label> <input type="number" id="lista3"${attr("value", articulo.Lista3)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="lista4" class="block text-sm font-medium text-gray-700 mb-1">Precio Lista 4</label> <input type="number" id="lista4"${attr("value", articulo.Lista4)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="lista5" class="block text-sm font-medium text-gray-700 mb-1">Precio Lista 5</label> <input type="number" id="lista5"${attr("value", articulo.Lista5)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div> <div><label for="porcentajeVendedor" class="block text-sm font-medium text-gray-700 mb-1">Porcentaje Vendedor</label> <input type="number" id="porcentajeVendedor"${attr("value", articulo.PorcentajeVendedor)} step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></div></div></div> <div><h2 class="text-lg font-medium mb-3 text-gray-800 border-b pb-2">Configuración</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label for="activo" class="block text-sm font-medium text-gray-700 mb-1">Activo</label> <select id="activo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 1)}>Sí</option><option${attr("value", 0)}>No</option></select></div> <div><label for="seVende" class="block text-sm font-medium text-gray-700 mb-1">Se Vende</label> <select id="seVende" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 1)}>Sí</option><option${attr("value", 0)}>No</option></select></div> <div><label for="requiereFrio" class="block text-sm font-medium text-gray-700 mb-1">Requiere Frío</label> <select id="requiereFrio" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 0)}>No</option><option${attr("value", 1)}>Sí</option></select></div> <div><label for="siempreSeDescarga" class="block text-sm font-medium text-gray-700 mb-1">Siempre Se Descarga</label> <select id="siempreSeDescarga" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 0)}>No</option><option${attr("value", 1)}>Sí</option></select></div> <div><label for="iva2SobreNeto" class="block text-sm font-medium text-gray-700 mb-1">IVA 2 Sobre Neto</label> <select id="iva2SobreNeto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 0)}>No</option><option${attr("value", 1)}>Sí</option></select></div> <div><label for="esCompuesto" class="block text-sm font-medium text-gray-700 mb-1">Es Compuesto</label> <select id="esCompuesto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"><option${attr("value", 0)}>No</option><option${attr("value", 1)}>Sí</option></select></div></div></div></div> <div class="flex justify-between pt-4">`;
  Button($$payload, {
    variant: "secondary",
    type: "button",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->Cancelar`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> `;
  Button($$payload, {
    variant: "primary",
    type: "submit",
    disabled: loading,
    children: ($$payload2) => {
      $$payload2.out += `<!---->${escape_html(loading ? "Guardando..." : "Guardar")}`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div></form></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
