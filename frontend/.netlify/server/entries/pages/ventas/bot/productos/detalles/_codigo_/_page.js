import { e as error } from "../../../../../../../chunks/index.js";
import { f as fetchWithAuth } from "../../../../../../../chunks/authStore.js";
const ssr = false;
async function load({ params }) {
  try {
    const codigo = params.codigo;
    const response = await fetchWithAuth(`/articulos/${codigo}`);
    if (!response.ok) {
      throw error(response.status || 500, `Error al cargar el producto con código ${codigo}`);
    }
    const articulo = await response.json();
    if (!articulo) {
      throw error(404, `Producto con código ${codigo} no encontrado`);
    }
    return {
      articulo
    };
  } catch (err) {
    console.error("Error al cargar el artículo:", err);
    throw error(500, "Error al cargar el producto. Intente nuevamente.");
  }
}
export {
  load,
  ssr
};
