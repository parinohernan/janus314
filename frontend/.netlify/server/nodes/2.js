import * as universal from '../entries/pages/productos/_layout.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/productos/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/productos/+layout.ts";
export const imports = ["_app/immutable/nodes/2.Bce3WPiC.js","_app/immutable/chunks/Bb8aiT13.js","_app/immutable/chunks/DuTeyNXo.js","_app/immutable/chunks/Da8o6Fp0.js"];
export const stylesheets = [];
export const fonts = [];
