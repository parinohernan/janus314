const { esArticuloPosVarios, POS_VARIOS_CODIGOS, ensureClienteConsumidorFinal } = require("../posVarios");

describe("esArticuloPosVarios", () => {
  it("reconoce los códigos dummy del POS", () => {
    expect(esArticuloPosVarios("VAR-ALM")).toBe(true);
    expect(esArticuloPosVarios("var-pan")).toBe(true);
    expect(esArticuloPosVarios("VAR-VER")).toBe(true);
  });

  it("reconoce sufijos VAR- usados si hay más de un renglón", () => {
    expect(esArticuloPosVarios("VAR-ALM2")).toBe(true);
  });

  it("no marca artículos normales", () => {
    expect(esArticuloPosVarios("388")).toBe(false);
    expect(esArticuloPosVarios("7791234567890")).toBe(false);
    expect(esArticuloPosVarios("")).toBe(false);
  });

  it("tiene los 6 rubros de caja", () => {
    expect(POS_VARIOS_CODIGOS.size).toBe(6);
  });
});

describe("ensureClienteConsumidorFinal", () => {
  it("devuelve el CF existente sin crear otro", async () => {
    const existente = { Codigo: "CF", Descripcion: "Consumidor Final" };
    const Cliente = {
      findByPk: jest.fn().mockResolvedValue(existente),
      create: jest.fn(),
    };
    const CategoriaIva = { findByPk: jest.fn(), create: jest.fn() };

    const result = await ensureClienteConsumidorFinal(Cliente, CategoriaIva);

    expect(result).toBe(existente);
    expect(Cliente.create).not.toHaveBeenCalled();
  });

  it("crea CF si no existe", async () => {
    const creado = { Codigo: "CF", Descripcion: "Consumidor Final" };
    const Cliente = {
      findByPk: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(creado),
    };
    const CategoriaIva = {
      findByPk: jest.fn().mockResolvedValue({ Codigo: "F" }),
      create: jest.fn(),
    };

    const result = await ensureClienteConsumidorFinal(Cliente, CategoriaIva);

    expect(result.Codigo).toBe("CF");
    expect(Cliente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        Codigo: "CF",
        Descripcion: "Consumidor Final",
        CategoriaIva: "F",
        Cuit: "00000000000",
      }),
      expect.anything()
    );
    expect(CategoriaIva.create).not.toHaveBeenCalled();
  });
});
