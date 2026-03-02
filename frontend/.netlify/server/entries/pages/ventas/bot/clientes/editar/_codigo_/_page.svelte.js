import { l as ensure_array_like, e as escape_html, k as attr, v as bind_props, c as pop, p as push } from "../../../../../../../chunks/index3.js";
import "../../../../../../../chunks/client.js";
/* empty css                              */
import { B as Breadcrumbs } from "../../../../../../../chunks/index4.js";
import "../../../../../../../chunks/authStore.js";
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  let cliente = {
    Codigo: data.cliente.Codigo || "",
    Descripcion: data.cliente.Descripcion || "",
    NombreFantasia: data.cliente.NombreFantasia || "",
    Cuit: data.cliente.Cuit || "",
    Telefono: data.cliente.Telefono || "",
    Email: data.cliente.Email || "",
    Domicilio: data.cliente.Domicilio || "",
    CodigoPostal: data.cliente.CodigoPostal || "",
    Localidad: data.cliente.Localidad || "",
    Provincia: data.cliente.Provincia || "",
    CategoriaIva: data.cliente.CategoriaIva || "",
    ListaPrecio: data.cliente.ListaPrecio || 1,
    LimiteCredito: data.cliente.LimiteCredito || 0,
    Activo: data.cliente.Activo || true
  };
  let loading = false;
  let categoriasIva = [];
  const each_array = ensure_array_like(categoriasIva);
  $$payload.out += `<div class="editar-cliente-container svelte-hnb3x">`;
  Breadcrumbs($$payload, {});
  $$payload.out += `<!----> <header class="header svelte-hnb3x"><div class="header-title svelte-hnb3x"><h1 class="svelte-hnb3x">Editar Cliente</h1> <div class="cliente-code svelte-hnb3x">Código: ${escape_html(cliente.Codigo)}</div></div></header> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form class="edit-form svelte-hnb3x"><div class="form-grid svelte-hnb3x"><div class="form-group svelte-hnb3x"><label for="descripcion" class="svelte-hnb3x">Nombre/Razón Social *</label> <input type="text" id="descripcion"${attr("value", cliente.Descripcion)} required maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="nombreFantasia" class="svelte-hnb3x">Nombre Fantasía</label> <input type="text" id="nombreFantasia"${attr("value", cliente.NombreFantasia)} maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="cuit" class="svelte-hnb3x">CUIT/DNI</label> <input type="text" id="cuit"${attr("value", cliente.Cuit)} maxlength="13" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="telefono" class="svelte-hnb3x">Teléfono</label> <input type="text" id="telefono"${attr("value", cliente.Telefono)} maxlength="50" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="email" class="svelte-hnb3x">Email</label> <input type="email" id="email"${attr("value", cliente.Email)} maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="domicilio" class="svelte-hnb3x">Domicilio</label> <input type="text" id="domicilio"${attr("value", cliente.Domicilio)} maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="codigoPostal" class="svelte-hnb3x">Código Postal</label> <input type="text" id="codigoPostal"${attr("value", cliente.CodigoPostal)} maxlength="10" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="localidad" class="svelte-hnb3x">Localidad</label> <input type="text" id="localidad"${attr("value", cliente.Localidad)} maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="provincia" class="svelte-hnb3x">Provincia</label> <input type="text" id="provincia"${attr("value", cliente.Provincia)} maxlength="100" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="categoriaIva" class="svelte-hnb3x">Categoría IVA *</label> <select id="categoriaIva" required class="svelte-hnb3x"><option value="">Seleccione una categoría</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let categoria = each_array[$$index];
    $$payload.out += `<option${attr("value", categoria.Codigo)}>${escape_html(categoria.Descripcion)}</option>`;
  }
  $$payload.out += `<!--]--></select></div> <div class="form-group svelte-hnb3x"><label for="listaPrecio" class="svelte-hnb3x">Lista de Precios</label> <input type="number" id="listaPrecio"${attr("value", cliente.ListaPrecio)} min="1" max="9" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label for="limiteCredito" class="svelte-hnb3x">Límite de Crédito</label> <input type="number" id="limiteCredito"${attr("value", cliente.LimiteCredito)} step="0.01" min="0" class="svelte-hnb3x"></div> <div class="form-group svelte-hnb3x"><label class="checkbox-label svelte-hnb3x"><input type="checkbox"${attr("checked", cliente.Activo, true)} class="svelte-hnb3x"> Cliente Activo</label></div></div> <div class="form-actions svelte-hnb3x"><button type="button" class="btn-cancel svelte-hnb3x">Cancelar</button> <button type="submit" class="btn-save svelte-hnb3x"${attr("disabled", loading, true)}>${escape_html("Guardar Cambios")}</button></div></form></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
