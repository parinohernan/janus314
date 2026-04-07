import { init } from '../serverless.js';

export const handler = init((() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","favicon.svg","janus314.png","logojano.png","pokoyojanologo.png"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Dv7lR6QE.js",app:"_app/immutable/entry/app.D7o7H0ng.js",imports:["_app/immutable/entry/start.Dv7lR6QE.js","_app/immutable/chunks/D4s_9-kB.js","_app/immutable/chunks/BfWJ6X8D.js","_app/immutable/chunks/DuTeyNXo.js","_app/immutable/chunks/7wpwwRiW.js","_app/immutable/entry/app.D7o7H0ng.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DuTeyNXo.js","_app/immutable/chunks/CVqLThch.js","_app/immutable/chunks/Cf8EduWr.js","_app/immutable/chunks/Du3r_q3k.js","_app/immutable/chunks/Bb8aiT13.js","_app/immutable/chunks/4plhfGPR.js","_app/immutable/chunks/BJrNCAbJ.js","_app/immutable/chunks/CdXIRzu0.js","_app/immutable/chunks/vVI4ANtn.js","_app/immutable/chunks/f1pGwX31.js","_app/immutable/chunks/CxetLVD3.js","_app/immutable/chunks/7wpwwRiW.js","_app/immutable/chunks/BfWJ6X8D.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../server/nodes/0.js')),
			__memo(() => import('../server/nodes/1.js')),
			__memo(() => import('../server/nodes/2.js')),
			__memo(() => import('../server/nodes/3.js')),
			__memo(() => import('../server/nodes/4.js')),
			__memo(() => import('../server/nodes/5.js')),
			__memo(() => import('../server/nodes/6.js')),
			__memo(() => import('../server/nodes/7.js')),
			__memo(() => import('../server/nodes/8.js')),
			__memo(() => import('../server/nodes/9.js')),
			__memo(() => import('../server/nodes/10.js')),
			__memo(() => import('../server/nodes/11.js')),
			__memo(() => import('../server/nodes/12.js')),
			__memo(() => import('../server/nodes/13.js')),
			__memo(() => import('../server/nodes/14.js')),
			__memo(() => import('../server/nodes/15.js')),
			__memo(() => import('../server/nodes/16.js')),
			__memo(() => import('../server/nodes/17.js')),
			__memo(() => import('../server/nodes/18.js')),
			__memo(() => import('../server/nodes/19.js')),
			__memo(() => import('../server/nodes/20.js')),
			__memo(() => import('../server/nodes/21.js')),
			__memo(() => import('../server/nodes/22.js')),
			__memo(() => import('../server/nodes/23.js')),
			__memo(() => import('../server/nodes/24.js')),
			__memo(() => import('../server/nodes/25.js')),
			__memo(() => import('../server/nodes/26.js')),
			__memo(() => import('../server/nodes/27.js')),
			__memo(() => import('../server/nodes/28.js')),
			__memo(() => import('../server/nodes/29.js')),
			__memo(() => import('../server/nodes/30.js')),
			__memo(() => import('../server/nodes/31.js')),
			__memo(() => import('../server/nodes/32.js')),
			__memo(() => import('../server/nodes/33.js')),
			__memo(() => import('../server/nodes/34.js')),
			__memo(() => import('../server/nodes/35.js')),
			__memo(() => import('../server/nodes/36.js')),
			__memo(() => import('../server/nodes/37.js')),
			__memo(() => import('../server/nodes/38.js')),
			__memo(() => import('../server/nodes/39.js')),
			__memo(() => import('../server/nodes/40.js')),
			__memo(() => import('../server/nodes/41.js')),
			__memo(() => import('../server/nodes/42.js')),
			__memo(() => import('../server/nodes/43.js')),
			__memo(() => import('../server/nodes/44.js')),
			__memo(() => import('../server/nodes/45.js')),
			__memo(() => import('../server/nodes/46.js')),
			__memo(() => import('../server/nodes/47.js')),
			__memo(() => import('../server/nodes/48.js')),
			__memo(() => import('../server/nodes/49.js')),
			__memo(() => import('../server/nodes/50.js')),
			__memo(() => import('../server/nodes/51.js')),
			__memo(() => import('../server/nodes/52.js')),
			__memo(() => import('../server/nodes/53.js')),
			__memo(() => import('../server/nodes/54.js')),
			__memo(() => import('../server/nodes/55.js')),
			__memo(() => import('../server/nodes/56.js')),
			__memo(() => import('../server/nodes/57.js')),
			__memo(() => import('../server/nodes/58.js')),
			__memo(() => import('../server/nodes/59.js')),
			__memo(() => import('../server/nodes/60.js')),
			__memo(() => import('../server/nodes/61.js')),
			__memo(() => import('../server/nodes/62.js')),
			__memo(() => import('../server/nodes/63.js')),
			__memo(() => import('../server/nodes/64.js')),
			__memo(() => import('../server/nodes/65.js')),
			__memo(() => import('../server/nodes/66.js')),
			__memo(() => import('../server/nodes/67.js')),
			__memo(() => import('../server/nodes/68.js')),
			__memo(() => import('../server/nodes/69.js')),
			__memo(() => import('../server/nodes/70.js')),
			__memo(() => import('../server/nodes/71.js')),
			__memo(() => import('../server/nodes/72.js')),
			__memo(() => import('../server/nodes/73.js')),
			__memo(() => import('../server/nodes/74.js')),
			__memo(() => import('../server/nodes/75.js')),
			__memo(() => import('../server/nodes/76.js')),
			__memo(() => import('../server/nodes/77.js')),
			__memo(() => import('../server/nodes/78.js')),
			__memo(() => import('../server/nodes/79.js')),
			__memo(() => import('../server/nodes/80.js')),
			__memo(() => import('../server/nodes/81.js')),
			__memo(() => import('../server/nodes/82.js')),
			__memo(() => import('../server/nodes/83.js')),
			__memo(() => import('../server/nodes/84.js')),
			__memo(() => import('../server/nodes/85.js')),
			__memo(() => import('../server/nodes/86.js')),
			__memo(() => import('../server/nodes/87.js')),
			__memo(() => import('../server/nodes/88.js')),
			__memo(() => import('../server/nodes/89.js')),
			__memo(() => import('../server/nodes/90.js')),
			__memo(() => import('../server/nodes/91.js')),
			__memo(() => import('../server/nodes/92.js')),
			__memo(() => import('../server/nodes/93.js')),
			__memo(() => import('../server/nodes/94.js')),
			__memo(() => import('../server/nodes/95.js')),
			__memo(() => import('../server/nodes/96.js')),
			__memo(() => import('../server/nodes/97.js')),
			__memo(() => import('../server/nodes/98.js')),
			__memo(() => import('../server/nodes/99.js')),
			__memo(() => import('../server/nodes/100.js')),
			__memo(() => import('../server/nodes/101.js')),
			__memo(() => import('../server/nodes/102.js')),
			__memo(() => import('../server/nodes/103.js')),
			__memo(() => import('../server/nodes/104.js')),
			__memo(() => import('../server/nodes/105.js')),
			__memo(() => import('../server/nodes/106.js')),
			__memo(() => import('../server/nodes/107.js')),
			__memo(() => import('../server/nodes/108.js')),
			__memo(() => import('../server/nodes/109.js')),
			__memo(() => import('../server/nodes/110.js')),
			__memo(() => import('../server/nodes/111.js')),
			__memo(() => import('../server/nodes/112.js')),
			__memo(() => import('../server/nodes/113.js')),
			__memo(() => import('../server/nodes/114.js')),
			__memo(() => import('../server/nodes/115.js')),
			__memo(() => import('../server/nodes/116.js')),
			__memo(() => import('../server/nodes/117.js')),
			__memo(() => import('../server/nodes/118.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/arca",
				pattern: /^\/arca\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/articulos",
				pattern: /^\/articulos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/caja",
				pattern: /^\/caja\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/caja/arqueo",
				pattern: /^\/caja\/arqueo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/caja/cerradas",
				pattern: /^\/caja\/cerradas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/caja/cierre",
				pattern: /^\/caja\/cierre\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/caja/egreso",
				pattern: /^\/caja\/egreso\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/caja/ingreso",
				pattern: /^\/caja\/ingreso\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/clientes",
				pattern: /^\/clientes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/clientes/cuentascorrientes",
				pattern: /^\/clientes\/cuentascorrientes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/clientes/cuentascorrientes/[id]",
				pattern: /^\/clientes\/cuentascorrientes\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/clientes/[id]",
				pattern: /^\/clientes\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/compras/compras",
				pattern: /^\/compras\/compras\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/compras/compras/[tipo]/[sucursal]/[numero]",
				pattern: /^\/compras\/compras\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/compras/cuentascorrientes",
				pattern: /^\/compras\/cuentascorrientes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/compras/cuentascorrientes/[id]",
				pattern: /^\/compras\/cuentascorrientes\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/compras/facturas",
				pattern: /^\/compras\/facturas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/compras/facturas/nueva",
				pattern: /^\/compras\/facturas\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/compras/facturas/[tipo]/[sucursal]/[numero]",
				pattern: /^\/compras\/facturas\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/compras/notascredito",
				pattern: /^\/compras\/notascredito\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/compras/notasdebito",
				pattern: /^\/compras\/notasdebito\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/compras/ordenes",
				pattern: /^\/compras\/ordenes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/compras/ordenes/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/compras\/ordenes\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/compras/ordenes/nueva",
				pattern: /^\/compras\/ordenes\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/compras/ordenes/[tipo]/[sucursal]/[numero]",
				pattern: /^\/compras\/ordenes\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/compras/proveedores",
				pattern: /^\/compras\/proveedores\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/compras/proveedores/[id]",
				pattern: /^\/compras\/proveedores\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/compras/recibos",
				pattern: /^\/compras\/recibos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/compras/recibos/nueva",
				pattern: /^\/compras\/recibos\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/configuracion",
				pattern: /^\/configuracion\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/configuracion/optimizacion",
				pattern: /^\/configuracion\/optimizacion\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/empresa",
				pattern: /^\/empresa\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/localidades",
				pattern: /^\/localidades\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/localidades/[id]",
				pattern: /^\/localidades\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/notascredito",
				pattern: /^\/notascredito\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 45 },
				endpoint: null
			},
			{
				id: "/productos",
				pattern: /^\/productos\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 46 },
				endpoint: null
			},
			{
				id: "/productos/existencia",
				pattern: /^\/productos\/existencia\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 48 },
				endpoint: null
			},
			{
				id: "/productos/precios/actualizacionmanual",
				pattern: /^\/productos\/precios\/actualizacionmanual\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 50 },
				endpoint: null
			},
			{
				id: "/productos/precios/actualizacion",
				pattern: /^\/productos\/precios\/actualizacion\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 49 },
				endpoint: null
			},
			{
				id: "/productos/precios/actualizarconlista",
				pattern: /^\/productos\/precios\/actualizarconlista\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 51 },
				endpoint: null
			},
			{
				id: "/productos/precios/listado",
				pattern: /^\/productos\/precios\/listado\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 52 },
				endpoint: null
			},
			{
				id: "/productos/stock",
				pattern: /^\/productos\/stock\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 53 },
				endpoint: null
			},
			{
				id: "/productos/stock/nuevo/ingreso-remito",
				pattern: /^\/productos\/stock\/nuevo\/ingreso-remito\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 56 },
				endpoint: null
			},
			{
				id: "/productos/stock/nuevo/[tipo]",
				pattern: /^\/productos\/stock\/nuevo\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 55 },
				endpoint: null
			},
			{
				id: "/productos/stock/[tipo]/[sucursal]/[numero]",
				pattern: /^\/productos\/stock\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 54 },
				endpoint: null
			},
			{
				id: "/productos/[id]",
				pattern: /^\/productos\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 47 },
				endpoint: null
			},
			{
				id: "/provincias",
				pattern: /^\/provincias\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 57 },
				endpoint: null
			},
			{
				id: "/provincias/[id]",
				pattern: /^\/provincias\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 58 },
				endpoint: null
			},
			{
				id: "/rubros",
				pattern: /^\/rubros\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 59 },
				endpoint: null
			},
			{
				id: "/rubros/[id]",
				pattern: /^\/rubros\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 60 },
				endpoint: null
			},
			{
				id: "/rubros/[id]/editar",
				pattern: /^\/rubros\/([^/]+?)\/editar\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 61 },
				endpoint: null
			},
			{
				id: "/sincronizacion/actualizar-datos",
				pattern: /^\/sincronizacion\/actualizar-datos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 62 },
				endpoint: null
			},
			{
				id: "/sincronizacion/configuracion",
				pattern: /^\/sincronizacion\/configuracion\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 63 },
				endpoint: null
			},
			{
				id: "/sincronizacion/descargar-datos",
				pattern: /^\/sincronizacion\/descargar-datos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 64 },
				endpoint: null
			},
			{
				id: "/sincronizacion/preventas",
				pattern: /^\/sincronizacion\/preventas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 65 },
				endpoint: null
			},
			{
				id: "/tablas",
				pattern: /^\/tablas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 66 },
				endpoint: null
			},
			{
				id: "/tablas/tipos-de-pago",
				pattern: /^\/tablas\/tipos-de-pago\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 67 },
				endpoint: null
			},
			{
				id: "/ventas/bot",
				pattern: /^\/ventas\/bot\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 68 },
				endpoint: null
			},
			{
				id: "/ventas/bot/alerta-stock",
				pattern: /^\/ventas\/bot\/alerta-stock\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 69 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja",
				pattern: /^\/ventas\/bot\/caja\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 70 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja/arqueo",
				pattern: /^\/ventas\/bot\/caja\/arqueo\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 71 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja/cerradas",
				pattern: /^\/ventas\/bot\/caja\/cerradas\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 72 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja/cierre",
				pattern: /^\/ventas\/bot\/caja\/cierre\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 73 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja/egreso",
				pattern: /^\/ventas\/bot\/caja\/egreso\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 74 },
				endpoint: null
			},
			{
				id: "/ventas/bot/caja/ingreso",
				pattern: /^\/ventas\/bot\/caja\/ingreso\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 75 },
				endpoint: null
			},
			{
				id: "/ventas/bot/clientes",
				pattern: /^\/ventas\/bot\/clientes\/?$/,
				params: [],
				page: { layouts: [0,4,5,], errors: [1,,,], leaf: 76 },
				endpoint: null
			},
			{
				id: "/ventas/bot/clientes/detalles/[codigo]",
				pattern: /^\/ventas\/bot\/clientes\/detalles\/([^/]+?)\/?$/,
				params: [{"name":"codigo","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,5,], errors: [1,,,], leaf: 77 },
				endpoint: null
			},
			{
				id: "/ventas/bot/clientes/editar/[codigo]",
				pattern: /^\/ventas\/bot\/clientes\/editar\/([^/]+?)\/?$/,
				params: [{"name":"codigo","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,5,], errors: [1,,,], leaf: 78 },
				endpoint: null
			},
			{
				id: "/ventas/bot/clientes/nuevo-cliente",
				pattern: /^\/ventas\/bot\/clientes\/nuevo-cliente\/?$/,
				params: [],
				page: { layouts: [0,4,5,], errors: [1,,,], leaf: 79 },
				endpoint: null
			},
			{
				id: "/ventas/bot/comprobantes",
				pattern: /^\/ventas\/bot\/comprobantes\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 80 },
				endpoint: null
			},
			{
				id: "/ventas/bot/estadisticas",
				pattern: /^\/ventas\/bot\/estadisticas\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 81 },
				endpoint: null
			},
			{
				id: "/ventas/bot/home",
				pattern: /^\/ventas\/bot\/home\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 82 },
				endpoint: null
			},
			{
				id: "/ventas/bot/minimonster",
				pattern: /^\/ventas\/bot\/minimonster\/?$/,
				params: [],
				page: { layouts: [0,4,6,], errors: [1,,,], leaf: 83 },
				endpoint: null
			},
			{
				id: "/ventas/bot/nueva",
				pattern: /^\/ventas\/bot\/nueva\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 84 },
				endpoint: null
			},
			{
				id: "/ventas/bot/productos",
				pattern: /^\/ventas\/bot\/productos\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 85 },
				endpoint: null
			},
			{
				id: "/ventas/bot/productos/detalles/[codigo]",
				pattern: /^\/ventas\/bot\/productos\/detalles\/([^/]+?)\/?$/,
				params: [{"name":"codigo","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,], errors: [1,,], leaf: 86 },
				endpoint: null
			},
			{
				id: "/ventas/bot/productos/editar/[codigo]",
				pattern: /^\/ventas\/bot\/productos\/editar\/([^/]+?)\/?$/,
				params: [{"name":"codigo","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,], errors: [1,,], leaf: 87 },
				endpoint: null
			},
			{
				id: "/ventas/bot/productos/nuevo",
				pattern: /^\/ventas\/bot\/productos\/nuevo\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 88 },
				endpoint: null
			},
			{
				id: "/ventas/bot/recibos",
				pattern: /^\/ventas\/bot\/recibos\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 89 },
				endpoint: null
			},
			{
				id: "/ventas/bot/recibos/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/bot\/recibos\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,], errors: [1,,], leaf: 90 },
				endpoint: null
			},
			{
				id: "/ventas/bot/recibos/nuevo",
				pattern: /^\/ventas\/bot\/recibos\/nuevo\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 91 },
				endpoint: null
			},
			{
				id: "/ventas/clientes",
				pattern: /^\/ventas\/clientes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 92 },
				endpoint: null
			},
			{
				id: "/ventas/facturas",
				pattern: /^\/ventas\/facturas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 93 },
				endpoint: null
			},
			{
				id: "/ventas/facturas/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/facturas\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 95 },
				endpoint: null
			},
			{
				id: "/ventas/facturas/nueva",
				pattern: /^\/ventas\/facturas\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 96 },
				endpoint: null
			},
			{
				id: "/ventas/facturas/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/facturas\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 94 },
				endpoint: null
			},
			{
				id: "/ventas/informes/clientes",
				pattern: /^\/ventas\/informes\/clientes\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 97 },
				endpoint: null
			},
			{
				id: "/ventas/informes/facturacion",
				pattern: /^\/ventas\/informes\/facturacion\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 98 },
				endpoint: null
			},
			{
				id: "/ventas/informes/productos",
				pattern: /^\/ventas\/informes\/productos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 99 },
				endpoint: null
			},
			{
				id: "/ventas/informes/proveedores",
				pattern: /^\/ventas\/informes\/proveedores\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 100 },
				endpoint: null
			},
			{
				id: "/ventas/informes/rubros",
				pattern: /^\/ventas\/informes\/rubros\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 101 },
				endpoint: null
			},
			{
				id: "/ventas/informes/vendedores",
				pattern: /^\/ventas\/informes\/vendedores\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 102 },
				endpoint: null
			},
			{
				id: "/ventas/notascredito",
				pattern: /^\/ventas\/notascredito\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 103 },
				endpoint: null
			},
			{
				id: "/ventas/notascredito/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/notascredito\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 104 },
				endpoint: null
			},
			{
				id: "/ventas/notascredito/nueva",
				pattern: /^\/ventas\/notascredito\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 105 },
				endpoint: null
			},
			{
				id: "/ventas/notascredito/rapida",
				pattern: /^\/ventas\/notascredito\/rapida\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 106 },
				endpoint: null
			},
			{
				id: "/ventas/notasdebito",
				pattern: /^\/ventas\/notasdebito\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 107 },
				endpoint: null
			},
			{
				id: "/ventas/notasdebito/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/notasdebito\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 109 },
				endpoint: null
			},
			{
				id: "/ventas/notasdebito/nueva",
				pattern: /^\/ventas\/notasdebito\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 110 },
				endpoint: null
			},
			{
				id: "/ventas/notasdebito/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/notasdebito\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 108 },
				endpoint: null
			},
			{
				id: "/ventas/pedidos",
				pattern: /^\/ventas\/pedidos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 111 },
				endpoint: null
			},
			{
				id: "/ventas/preventas",
				pattern: /^\/ventas\/preventas\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 112 },
				endpoint: null
			},
			{
				id: "/ventas/preventas/facturar",
				pattern: /^\/ventas\/preventas\/facturar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 113 },
				endpoint: null
			},
			{
				id: "/ventas/preventas/nueva",
				pattern: /^\/ventas\/preventas\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 114 },
				endpoint: null
			},
			{
				id: "/ventas/recibos",
				pattern: /^\/ventas\/recibos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 115 },
				endpoint: null
			},
			{
				id: "/ventas/recibos/imprimir/[tipo]/[sucursal]/[numero]",
				pattern: /^\/ventas\/recibos\/imprimir\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"tipo","optional":false,"rest":false,"chained":false},{"name":"sucursal","optional":false,"rest":false,"chained":false},{"name":"numero","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,7,], errors: [1,,], leaf: 116 },
				endpoint: null
			},
			{
				id: "/ventas/recibos/nueva",
				pattern: /^\/ventas\/recibos\/nueva\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 117 },
				endpoint: null
			},
			{
				id: "/ventas/recibos/nuevo",
				pattern: /^\/ventas\/recibos\/nuevo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 118 },
				endpoint: null
			},
			{
				id: "/[...catchall]",
				pattern: /^(?:\/(.*))?\/?$/,
				params: [{"name":"catchall","optional":false,"rest":true,"chained":true}],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})());
