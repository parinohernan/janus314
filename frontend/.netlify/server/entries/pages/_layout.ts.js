const load = async () => {
  return {
    session: {
      user: false
      // Durante SSR, asumimos que no hay usuario
    }
  };
};
export {
  load
};
