import { f as fetchWithAuth } from "../../../../../../../chunks/authStore.js";
const load = async ({ params, fetch }) => {
  try {
    const response = await fetchWithAuth(`/clientes/${params.codigo}`, { fetch });
    if (!response.ok) {
      throw new Error("Cliente no encontrado");
    }
    const cliente = await response.json();
    return {
      cliente
    };
  } catch (error) {
    console.error("Error al cargar cliente:", error);
    return {
      cliente: {}
    };
  }
};
export {
  load
};
