describe("Gestión de Clientes", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/clientes/*", { fixture: "cliente.json" }).as(
      "getCliente"
    );
    cy.intercept("GET", "/api/categoriasiva", {
      fixture: "categoriasIva.json",
    }).as("getCategoriasIva");
    cy.intercept("GET", "/api/provincias", { fixture: "provincias.json" }).as(
      "getProvincias"
    );
    cy.intercept("GET", "/api/localidades", { fixture: "localidades.json" }).as(
      "getLocalidades"
    );
  });

  it("debe permitir crear un cliente nuevo", () => {
    cy.visit("/clientes/nuevo");

    cy.wait(["@getCategoriasIva", "@getProvincias", "@getLocalidades"]);

    // Completar el formulario
    cy.get("#codigo").type("CLI003");
    cy.get("#descripcion").type("Cliente de Prueba E2E");
    cy.get("#cuit").type("20123456789");

    // Elegir opciones en selects
    cy.get("#categoriaIva").select("1");
    cy.get("#provinciaCodigo").select("1");

    // Guardar el formulario
    cy.intercept("POST", "/api/clientes", {
      statusCode: 201,
      body: { Codigo: "CLI003", Descripcion: "Cliente de Prueba E2E" },
    }).as("saveCliente");

    cy.get('button[type="submit"]').click();

    cy.wait("@saveCliente");

    // Verificar redirección y mensaje de éxito
    cy.url().should("include", "/clientes/CLI003");
    cy.contains('Cliente "CLI003" creado correctamente');
  });

  it("debe permitir editar un cliente existente", () => {
    cy.visit("/clientes/CLI001");

    cy.wait("@getCliente");

    // Modificar datos
    cy.get("#descripcion").clear().type("Cliente Modificado");

    // Guardar cambios
    cy.intercept("PUT", "/api/clientes/CLI001", {
      statusCode: 200,
      body: { Codigo: "CLI001", Descripcion: "Cliente Modificado" },
    }).as("updateCliente");

    cy.get('button[type="submit"]').click();

    cy.wait("@updateCliente");

    // Verificar mensaje de éxito
    cy.contains('Cliente "CLI001" actualizado correctamente');
  });

  it("debe mostrar errores de validación", () => {
    cy.visit("/clientes/nuevo");

    // Intentar enviar sin datos obligatorios
    cy.get('button[type="submit"]').click();

    // Verificar mensajes de validación
    cy.get("#codigo:invalid").should("exist");
    cy.get("#descripcion:invalid").should("exist");
  });
});
