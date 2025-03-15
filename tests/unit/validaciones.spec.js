import { describe, it, expect } from "vitest";
import { validarCuit, validarEmail } from "../../src/lib/utils/validaciones";

describe("Funciones de validación", () => {
  it("debe validar un CUIT correctamente", () => {
    expect(validarCuit("20123456789")).toBe(true);
    expect(validarCuit("2012345678")).toBe(false); // longitud incorrecta
    expect(validarCuit("201234567A9")).toBe(false); // caracteres inválidos
  });

  it("debe validar un email correctamente", () => {
    expect(validarEmail("test@example.com")).toBe(true);
    expect(validarEmail("invalid-email")).toBe(false);
  });
});
