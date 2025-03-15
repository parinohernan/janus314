import { render, fireEvent, waitFor } from "@testing-library/svelte";
import ClienteForm from "../../src/routes/clientes/[id]/+page.svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Estado del Formulario de Cliente", () => {
  beforeEach(() => {
    vi.mock("$app/stores");
    vi.mock("$app/navigation");
    vi.mock("$env/static/public");
    global.fetch = vi.fn();
  });

  it("debe cambiar de estado edición a visualización correctamente", async () => {
    // Configurar mocks y probar el cambio de estado
  });

  it("debe mostrar mensaje de éxito después de guardar", async () => {
    // Implementar la prueba del mensaje de éxito
  });
});
