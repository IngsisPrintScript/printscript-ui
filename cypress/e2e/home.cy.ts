import { BACKEND_URL, FRONTEND_URL } from "../../src/utils/constants";
import { CreateSnippet } from "../../src/utils/snippet";

describe('Home (LOCAL)', () => {

  beforeEach(() => {
    // Auth0 deshabilitado por ahora
    // cy.loginToAuth0(AUTH0_USERNAME, AUTH0_PASSWORD)

    cy.intercept('GET', `${BACKEND_URL}/snippets*`, {
      statusCode: 200,
      body: [
        {
          id: "1",
          name: "Snippet 1",
          content: "print(1)",
          language: "printscript",
          version: "1.0",
          extension: ".pisp",
          compliance: "COMPILE",
          author: "test-user"
        }
      ]
    }).as('getSnippets');
  });

  it('Renders home', () => {
    cy.visit(FRONTEND_URL);

    cy.contains('Printscript').should('be.visible');

    cy.get('[data-testid="snippet-search-input"]').should('be.visible');

    cy.get('[data-testid="open-add-snippet-modal"]').should('be.visible');
  });

  it('Renders the first snippets', () => {
    cy.visit(FRONTEND_URL);

    cy.wait('@getSnippets');

    cy.get('[data-testid="snippet-row"]')
        .should('have.length.greaterThan', 0)
        .and('have.length.lessThan', 10);
  });

  it('Can create snippet and find it by name', () => {
    const snippetData: CreateSnippet = {
      name: "Test name",
      content: "print(1)",
      version: "1.0",
      language: "printscript",
      extension: ".pisp"
    };

    cy.intercept('POST', `${BACKEND_URL}/snippets`, {
      statusCode: 200,
      body: {
        ...snippetData,
        id: "123",
        compliance: "COMPILE",
        author: "test-user"
      }
    }).as('createSnippet');

    cy.visit(FRONTEND_URL);

    // Abrir modal
    cy.get('[data-testid="open-add-snippet-modal"]').click();

    cy.contains("Name")
        .parent()
        .find("input")
        .type(snippetData.name);

    cy.get('[role="combobox"]').click();
    cy.contains("Printscript").click();

    cy.get('[data-testid="add-snippet-code-editor"]')
        .type(snippetData.content);

    cy.get('[data-testid="save-snippet-button"]').click();

    cy.wait('@createSnippet');

    // Buscar snippet
    cy.get('[data-testid="snippet-search-input"]')
        .clear()
        .type(snippetData.name);

    cy.wait('@getSnippets');

    cy.contains(snippetData.name).should('exist');
  });

});