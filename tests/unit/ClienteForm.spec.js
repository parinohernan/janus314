import { render, fireEvent } from "@testing-library/svelte";
import ClienteForm from "../../src/routes/clientes/[id]/+page.svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("$app/stores", () => ({
  page: { subscribe: vi.fn(() => ({ id: "test123" })) },
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$env/static/public", () => ({
  PUBLIC_API_URL: "http://localhost:3000",
}));

describe("Componente de Formulario de Cliente", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("debe mostrar el título correcto para nuevo cliente", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { getByText } = render(ClienteForm, { params: { id: "nuevo" } });
    expect(getByText("Nuevo Cliente")).toBeTruthy();
  });

  it("debe validar el campo de código obligatorio", async () => {
    // Implementar la prueba de validación
  });

  it("debe cambiar el estado activo/inactivo correctamente", async () => {
    // Implementar la prueba del interruptor activo/inactivo
  });
});
