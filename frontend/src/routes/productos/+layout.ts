import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  // Asegurarse de que las rutas se manejen correctamente
  return {
    currentPath: url.pathname
  };
}; 