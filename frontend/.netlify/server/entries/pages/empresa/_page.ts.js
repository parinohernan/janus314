const load = async ({ parent }) => {
  await parent();
  return {
    title: "Mi Empresa"
  };
};
export {
  load
};
