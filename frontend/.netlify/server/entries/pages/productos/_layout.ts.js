const load = async ({ url }) => {
  return {
    currentPath: url.pathname
  };
};
export {
  load
};
