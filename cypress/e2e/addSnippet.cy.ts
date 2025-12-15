import { BACKEND_URL } from "../support/constants";

describe("Add snippet tests (REAL E2E)", () => {
  beforeEach(() => {
    cy.loginToAuth0(
        Cypress.env("AUTH0_USERNAME"),
        Cypress.env("AUTH0_PASSWORD")
    );
  });

  it("Can add snippets manually", () => {
    cy.intercept("POST", "**/snippet/create/**").as("createSnippet");

    // 1️⃣ Estar en Home
    cy.visit("/");
    cy.get(".MuiTable-root", { timeout: 20000 }).should("be.visible");

    // 2️⃣ Abrir modal
    cy.get('[data-testid="open-add-snippet-modal"]').click();
    cy.get('[data-testid="menu-create-snippet"]').click();

    // 3️⃣ Completar formulario
    cy.get('[data-testid="snippet-name-input"]')
        .should("be.visible")
        .type("Some snippet name");

    cy.get('[data-testid="snippet-language-select"]').click();
    cy.get('ul[role="listbox"]').contains("Printscript").click();

    cy.get('[data-testid="add-snippet-code-textarea"]')
        .should("exist")
        .clear({ force: true })
        .type(
            'let sarasa:string = "test";{enter}println(sarasa);',
            { force: true }
        );

    // 4️⃣ Guardar
    cy.get('[data-testid="save-snippet-button"]')
        .should("be.enabled")
        .click();

    // 5️⃣ Confirmar request
    cy.wait("@createSnippet")
        .its("response.statusCode")
        .should("be.oneOf", [200, 201]);
  });
  it("Can add snippets via file", () => {
    cy.intercept("POST", "**/snippet/create/**").as("createSnippet");

    cy.visit("/");
    cy.get(".MuiTable-root", { timeout: 20000 }).should("be.visible");

    cy.get('[data-testid="open-add-snippet-modal"]').click();
    cy.get('[data-testid="menu-upload-snippet"]').click();

    cy.get('[data-testid="upload-file-input"]')
        .selectFile("cypress/fixtures/example_ps.pisp", { force: true });

    cy.get('[data-testid="save-snippet-button"]')
        .should("be.enabled")
        .click();

    cy.wait("@createSnippet")
        .its("response.statusCode")
        .should("be.oneOf", [200, 201]);
  });
});
