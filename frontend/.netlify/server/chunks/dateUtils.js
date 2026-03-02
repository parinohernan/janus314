function getTodayISOArgentina() {
  const now = /* @__PURE__ */ new Date();
  const argentinaTime = new Date(now.getTime() - 3 * 60 * 60 * 1e3);
  return argentinaTime.toISOString().split("T")[0];
}
export {
  getTodayISOArgentina as g
};
