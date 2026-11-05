const { fechaHoyArgentina } = require("../utils/fechaArgentina");

describe("fechaArgentina", () => {
  it("fechaHoyArgentina devuelve YYYY-MM-DD", () => {
    expect(fechaHoyArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
