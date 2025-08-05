import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.LrS1Y-7h.js","_app/immutable/chunks/99qqc-sX.js","_app/immutable/chunks/Dc4V3wjj.js","_app/immutable/chunks/DpF9ERJf.js","_app/immutable/chunks/CyoSS2lz.js","_app/immutable/chunks/DGfZRWYp.js","_app/immutable/chunks/c4f_s63z.js","_app/immutable/chunks/BnrSOPoc.js","_app/immutable/chunks/DFUwBK5c.js","_app/immutable/chunks/BajG-cl9.js","_app/immutable/chunks/D0ukRgYW.js","_app/immutable/chunks/DI_lQaDA.js","_app/immutable/chunks/C3qNM5OK.js","_app/immutable/chunks/BSa6XFsM.js","_app/immutable/chunks/Ca1k-VKK.js","_app/immutable/chunks/C9YMP0FN.js","_app/immutable/chunks/DlL4T-Wv.js","_app/immutable/chunks/DqBsYiUT.js","_app/immutable/chunks/BOVaRt8e.js","_app/immutable/chunks/CXpNWeE2.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/BHYyYDEm.js","_app/immutable/chunks/B5TBUiQf.js"];
export const stylesheets = ["_app/immutable/assets/79.tn0RQdqM.css","_app/immutable/assets/app.CzwDXbg1.css"];
export const fonts = [];
