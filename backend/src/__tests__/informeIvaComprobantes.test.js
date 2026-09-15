const {
  TIPOS_FACTURA_IVA,
  TIPOS_NC_IVA,
  formatearCuit,
  inscripcionDesdeCategoria,
  ivaOVacio,
  mapearComprobanteIva,
  sumarTotales,
} = require("../services/informeIvaComprobantes.service");

describe("tipos IVA", () => {
  it("cubre facturas A/B/C y NC A/B", () => {
    expect(TIPOS_FACTURA_IVA).toEqual(["FCA", "FCB", "FCC"]);
    expect(TIPOS_NC_IVA).toEqual(["NCA", "NCB"]);
  });
});

describe("formatearCuit", () => {
  it("formatea 11 dígitos con guiones", () => {
    expect(formatearCuit("30617712977")).toBe("30-61771297-7");
  });

  it("limpia caracteres no numéricos antes de formatear", () => {
    expect(formatearCuit("30-61771297-7")).toBe("30-61771297-7");
  });

  it("devuelve vacío si no hay CUIT", () => {
    expect(formatearCuit(null)).toBe("");
    expect(formatearCuit("")).toBe("");
  });
});

describe("inscripcionDesdeCategoria", () => {
  it("usa textos cortos de la planilla", () => {
    expect(inscripcionDesdeCategoria("I")).toBe("Resp. inscripto");
    expect(inscripcionDesdeCategoria("M")).toBe("Monotributo");
    expect(inscripcionDesdeCategoria("E")).toBe("Exento");
    expect(inscripcionDesdeCategoria("F")).toBe("Cons. final");
  });

  it("infiere por descripción si el código no es conocido", () => {
    expect(inscripcionDesdeCategoria("X", "Responsable Inscripto")).toBe(
      "Resp. inscripto"
    );
    expect(inscripcionDesdeCategoria("", "Monotributista")).toBe("Monotributo");
  });
});

describe("ivaOVacio", () => {
  it("deja vacío el IVA en cero para el Excel", () => {
    expect(ivaOVacio(0)).toBeNull();
    expect(ivaOVacio(null)).toBeNull();
    expect(ivaOVacio(2581.23)).toBe(2581.23);
  });
});

describe("mapearComprobanteIva", () => {
  it("arma el DTO con IVA 10.5, 21, inscripción y CUIT", () => {
    expect(
      mapearComprobanteIva(
        {
          DocumentoTipo: "FCA",
          DocumentoSucursal: "0001",
          DocumentoNumero: "141",
          Fecha: "2026-08-04",
          ImporteTotal: 27414.38,
          ImporteIva1: 0,
          ImporteIva2: 2581.23,
          Cliente: {
            Descripcion: "Cliente 1",
            Cuit: "30533418194",
            CategoriaIva: "I",
          },
        },
        { I: "Responsable Inscripto" }
      )
    ).toEqual({
      fecha: "2026-08-04",
      tipo: "FCA",
      sucursal: "0001",
      numero: "00000141",
      cliente: "Cliente 1",
      importe: 27414.38,
      iva105: 2581.23,
      iva21: null,
      inscripcion: "Resp. inscripto",
      idTributario: "CUIT",
      cuit: "30-53341819-4",
    });
  });
});

describe("sumarTotales", () => {
  it("suma importe e IVA ignorando celdas vacías", () => {
    expect(
      sumarTotales([
        { importe: 100, iva105: null, iva21: 21 },
        { importe: 50, iva105: 5.25, iva21: null },
      ])
    ).toEqual({
      cantidad: 2,
      importe: 150,
      iva105: 5.25,
      iva21: 21,
    });
  });
});
