describe("Navegación de la Aplicación", () => {
  it("debe navegar desde la lista de clientes al formulario de nuevo cliente", () => {
    cy.visit("/clientes");

    cy.contains("Nuevo Cliente").click();

    cy.url().should("include", "/clientes/nuevo");
    cy.contains("h1", "Nuevo Cliente");
  });

  it("debe volver a la lista de clientes al cancelar", () => {
    cy.visit("/clientes/nuevo");

    cy.contains("Cancelar").click();

    cy.url().should("match", /\/clientes$/);
  });
});
