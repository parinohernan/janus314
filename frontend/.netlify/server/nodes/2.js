import * as universal from '../entries/pages/productos/_layout.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/productos/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/productos/+layout.ts";
export const imports = ["_app/immutable/nodes/2.8mOcEZyv.js","_app/immutable/chunks/99qqc-sX.js","_app/immutable/chunks/Dc4V3wjj.js","_app/immutable/chunks/CyoSS2lz.js"];
export const stylesheets = [];
export const fonts = [];
