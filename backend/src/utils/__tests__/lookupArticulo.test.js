const { lookupArticulo } = require("../../controllers/articulo.controller");

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("lookupArticulo", () => {
  it("busca primero por código de barras exacto", async () => {
    const articulo = { Codigo: "388", CodigoBarras: "779123", Activo: 1, Descripcion: "Glade" };
    const Articulo = {
      findOne: jest.fn()
        .mockResolvedValueOnce(articulo),
    };
    const req = { models: { Articulo }, query: { code: "779123" } };
    const res = mockRes();

    await lookupArticulo(req, res);

    expect(Articulo.findOne).toHaveBeenCalledWith({ where: { CodigoBarras: "779123" } });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.Codigo).toBe("388");
  });

  it("cae a código interno si no hay barras", async () => {
    const articulo = { Codigo: "388", Activo: 1, Descripcion: "Glade" };
    const Articulo = {
      findOne: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(articulo),
    };
    const req = { models: { Articulo }, query: { code: "388" } };
    const res = mockRes();

    await lookupArticulo(req, res);

    expect(Articulo.findOne).toHaveBeenNthCalledWith(2, { where: { Codigo: "388" } });
    expect(res.statusCode).toBe(200);
  });

  it("devuelve 404 si no existe", async () => {
    const Articulo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const req = { models: { Articulo }, query: { code: "nope" } };
    const res = mockRes();

    await lookupArticulo(req, res);

    expect(res.statusCode).toBe(404);
  });
});
