import '../support/commands';
import { CreateSnippet } from "../../src/utils/snippet";

describe("Home (REAL E2E + Auth0)", () => {

  beforeEach(() => {
    cy.loginToAuth0(
        Cypress.env("AUTH0_USERNAME"),
        Cypress.env("AUTH0_PASSWORD")
    );
  });

  it("Renders home", () => {
    cy.visit("/");

    cy.contains("Printscript", { timeout: 20000 }).should("be.visible");
    cy.get('[data-testid="snippet-search-input"]').should("be.visible");
    cy.get('[data-testid="open-add-snippet-modal"]').should("be.visible");
  });

  it("Renders the first snippets", () => {
    cy.visit("/");

    cy.get('[data-testid^="snippet-row-"]', { timeout: 20000 })
        .should("have.length.greaterThan", 0)
        .and("have.length.lessThan", 10);
  });

  it("Can create snippet and find it by name", () => {
    const name = `Test ${Date.now()}`;

    cy.visit("/");

    cy.get('[data-testid="open-add-snippet-modal"]').click();
    cy.get('[data-testid="menu-create-snippet"]').click();

    cy.get('[data-testid="snippet-name-input"]').type(name);

    cy.get('[data-testid="snippet-language-select"]').click();
    cy.get('[data-testid="menu-option-printscript"]')
        .should("be.visible")
        .click();
    cy.get('[data-testid="add-snippet-code-textarea"]')
        .clear({ force: true })
        .type("println(1);", { force: true });

    cy.get('[data-testid="save-snippet-button"]')
        .should("be.enabled")
        .click();

    // Buscar
    cy.get('[data-testid="snippet-search-input"]')
        .clear()
        .type(name);

    cy.contains(name, { timeout: 20000 }).should("exist");
  });
});