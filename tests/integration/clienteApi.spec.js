import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCliente, saveCliente } from "../../src/lib/api/clientesApi";

describe("API de Clientes", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("debe obtener los datos del cliente correctamente", async () => {
    const mockCliente = {
      Codigo: "CLI001",
      Descripcion: "Cliente Prueba",
      Activo: 1,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCliente),
    });

    const resultado = await fetchCliente("CLI001");
    expect(resultado).toEqual(mockCliente);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/clientes/CLI001"
    );
  });

  it("debe guardar un cliente nuevo correctamente", async () => {
    const nuevoCliente = {
      Codigo: "CLI002",
      Descripcion: "Nuevo Cliente",
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...nuevoCliente, id: 1 }),
    });

    const resultado = await saveCliente(nuevoCliente);
    expect(resultado.Codigo).toBe("CLI002");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/clientes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(nuevoCliente),
      })
    );
  });
});
