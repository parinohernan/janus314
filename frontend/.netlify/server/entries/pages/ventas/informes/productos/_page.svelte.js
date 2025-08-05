import { n as copy_payload, o as assign_payload, c as pop, p as push, e as escape_html, g as ensure_array_like, k as attr_class, l as stringify } from "../../../../../chunks/index3.js";
import "chart.js/auto";
import { D as DatePicker } from "../../../../../chunks/DatePicker.js";
import { E as EntitySelector } from "../../../../../chunks/EntitySelector.js";
import { f as fetchWithAuth } from "../../../../../chunks/fetchWithAuth.js";
function _page($$payload, $$props) {
  push();
  let fechaDesde = /* @__PURE__ */ new Date();
  fechaDesde.setMonth(fechaDesde.getMonth() - 1);
  fechaDesde.setHours(0, 0, 0, 0);
  let fechaHasta = /* @__PURE__ */ new Date();
  fechaHasta.setHours(23, 59, 59, 999);
  let productosSeleccionados = [];
  let datosVentas = null;
  let chartCanvas;
  const MAX_PRODUCTOS = 5;
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  async function cargarDatosVentas() {
    if (productosSeleccionados.length === 0) return;
    try {
      const response = await fetchWithAuth("/informes/ventas-por-productos", {
        params: {
          fechaDesde: formatDate(fechaDesde),
          fechaHasta: formatDate(fechaHasta),
          productos: productosSeleccionados.map((p) => p.codigo).join(",")
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la respuesta:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La respuesta no es JSON");
      }
      const result = await response.json();
      if (result.success) {
        datosVentas = result.data;
        actualizarGrafico();
      } else {
        throw new Error(result.message || "Error en el servidor");
      }
    } catch (error) {
      console.error("Error al cargar datos de ventas:", error);
      datosVentas = null;
    }
  }
  function actualizarGrafico() {
    if (!datosVentas || !datosVentas.productos || datosVentas.productos.length === 0) return;
    return;
  }
  if (fechaDesde && fechaHasta && productosSeleccionados.length > 0) {
    cargarDatosVentas();
  }
  if (datosVentas && chartCanvas) {
    actualizarGrafico();
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="container mx-auto p-4"><h1 class="text-2xl font-bold mb-6">Informe de Ventas por Productos</h1> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div><label for="fechaDesde" class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label> `;
    DatePicker($$payload2, {
      id: "fechaDesde",
      get value() {
        return fechaDesde;
      },
      set value($$value) {
        fechaDesde = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div> <div><label for="fechaHasta" class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label> `;
    DatePicker($$payload2, {
      id: "fechaHasta",
      get value() {
        return fechaHasta;
      },
      set value($$value) {
        fechaHasta = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div></div> <div class="mb-6"><label for="productoSelector" class="block text-sm font-medium text-gray-700 mb-2">Seleccionar Productos (máximo ${escape_html(MAX_PRODUCTOS)})</label> `;
    EntitySelector($$payload2, {
      id: "productoSelector",
      label: "",
      placeholder: "Buscar producto...",
      apiEndpoint: "/articulos",
      valueField: "Codigo",
      labelField: "Descripcion",
      minSearchLength: 3
    });
    $$payload2.out += `<!----></div> `;
    if (productosSeleccionados.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(productosSeleccionados);
      $$payload2.out += `<div class="mb-4"><h2 class="text-lg font-semibold mb-2">Productos Seleccionados:</h2> <div class="flex flex-wrap gap-2"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let producto = each_array[$$index];
        $$payload2.out += `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">${escape_html(producto.descripcion)} <button class="ml-2 text-blue-600 hover:text-blue-800">×</button></span>`;
      }
      $$payload2.out += `<!--]--></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (datosVentas) {
      $$payload2.out += "<!--[-->";
      const each_array_1 = ensure_array_like(datosVentas.productos);
      $$payload2.out += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="bg-white p-4 rounded-lg shadow"><div class="flex justify-between items-center mb-4"><h2 class="text-lg font-semibold">Gráfico de Ventas</h2> <div class="flex gap-2"><button${attr_class(`px-3 py-1 rounded ${stringify("bg-blue-500 text-white")}`)}>Cantidad</button> <button${attr_class(`px-3 py-1 rounded ${stringify("bg-gray-200")}`)}>Importe</button></div></div> <div class="h-96"><canvas></canvas></div></div> <div class="bg-white p-4 rounded-lg shadow"><h2 class="text-lg font-semibold mb-4">Resumen de Ventas</h2> <div class="space-y-4"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let producto = each_array_1[$$index_1];
        $$payload2.out += `<div class="border-b pb-2"><div class="flex justify-between"><span class="font-medium">${escape_html(producto.descripcion)}</span> <span class="text-gray-600">Código: ${escape_html(producto.codigo)}</span></div> <div class="flex justify-between mt-1"><span>Cantidad: ${escape_html(producto.cantidad)}</span> <span class="font-medium">Total: $${escape_html(producto.importeTotal.toFixed(2))}</span></div></div>`;
      }
      $$payload2.out += `<!--]--> <div class="pt-2 border-t"><div class="flex justify-between font-bold"><span>Total General:</span> <span>$${escape_html(datosVentas.totalVentas.toFixed(2))}</span></div></div></div></div></div>`;
    } else if (productosSeleccionados.length > 0) {
      $$payload2.out += "<!--[1-->";
      $$payload2.out += `<div class="text-center text-gray-500 py-8">Cargando datos...</div>`;
    } else {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `<div class="text-center text-gray-500 py-8">Seleccione al menos un producto para ver el informe</div>`;
    }
    $$payload2.out += `<!--]--></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
