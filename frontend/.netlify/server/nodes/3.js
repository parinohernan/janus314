import * as universal from '../entries/pages/productos/precios/_layout.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/productos/precios/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/productos/precios/+layout.ts";
export const imports = ["_app/immutable/nodes/3.8mOcEZyv.js","_app/immutable/chunks/99qqc-sX.js","_app/immutable/chunks/Dc4V3wjj.js","_app/immutable/chunks/CyoSS2lz.js"];
export const stylesheets = [];
export const fonts = [];
