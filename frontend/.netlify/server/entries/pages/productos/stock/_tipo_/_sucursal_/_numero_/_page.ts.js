import "../../../../../../../chunks/index.js";
const ssr = false;
const load = async ({ params }) => {
  return {
    tipo: params.tipo,
    sucursal: params.sucursal,
    numero: params.numero
  };
};
export {
  load,
  ssr
};
