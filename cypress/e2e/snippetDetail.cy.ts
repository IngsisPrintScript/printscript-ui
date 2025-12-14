import { BACKEND_URL } from "../../src/utils/constants";
import { FakeSnippetStore } from "../../src/utils/mock/fakeSnippetStore";

describe('Add snippet tests (LOCAL)', () => {

  const fakeStore = new FakeSnippetStore();

  beforeEach(() => {

    // 🔹 Listado de snippets (tabla)
    cy.intercept(
        'POST',
        `${BACKEND_URL}/snippet/filter`,
        {
          statusCode: 200,
          body: {
            page: 0,
            page_size: 10,
            count: 1,
            snippets: [
              {
                snippet: fakeStore.getSnippetById(
                    fakeStore.listSnippetDescriptors()[0].id
                ),
                valid: "PASSED",
                user: "test-user",
                content: "print(1)"
              }
            ]
          }
        }
    ).as('getSnippets');

    // 🔹 Detalle del snippet
    cy.intercept(
        'GET',
        `${BACKEND_URL}/snippet/*`,
        {
          statusCode: 200,
          body: fakeStore.listSnippetDescriptors()[0],
        }
    ).as('getSnippetById');

    // 🔹 Share snippet
    cy.intercept(
        'PUT',
        `${BACKEND_URL}/snippet/*/share`,
        { statusCode: 200 }
    ).as('shareSnippet');

    // 🔹 Run snippet
    cy.intercept(
        'POST',
        `${BACKEND_URL}/snippet/*/run`,
        {
          statusCode: 200,
          body: {
            outputs: ["mock output"],
            errors: []
          }
        }
    ).as('runSnippet');

    // 🔹 Format snippet
    cy.intercept(
        'POST',
        `${BACKEND_URL}/snippet/*/format`,
        {
          statusCode: 200,
          body: "// formatted snippet"
        }
    ).as('formatSnippet');

    // 🔹 Save snippet
    cy.intercept(
        'PUT',
        `${BACKEND_URL}/snippet/*`,
        { statusCode: 200 }
    ).as('saveSnippet');

    // 🔹 Delete snippet
    cy.intercept(
        'DELETE',
        `${BACKEND_URL}/snippet/*`,
        { statusCode: 200 }
    ).as('deleteSnippet');

    // Entramos a la app
    cy.visit('/');

    // Esperamos que cargue la tabla
    cy.wait('@getSnippets');

    // Abrimos el primer snippet
    cy.get('[data-testid="snippet-row"]').first().click();

    cy.wait('@getSnippetById');
  });

  it('Can share a snippet', () => {
    cy.get('[aria-label="Share"]').click();

    cy.get('[role="combobox"]').click();
    cy.get('[role="option"]').first().click();

    cy.contains('button', 'Share').click();

    cy.wait('@shareSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });

  it('Can run snippets', () => {
    cy.get('[data-testid="PlayArrowIcon"]').click();

    cy.wait('@runSnippet');

    cy.get('[data-testid="snippet-output"]')
        .should('exist');
  });

  it('Can format snippets', () => {
    cy.get('[data-testid="ReadMoreIcon"]').click();

    cy.wait('@formatSnippet');
  });

  it('Can save snippets', () => {
    cy.get('[data-testid="snippet-code-editor"]')
        .click()
        .type('\nSome new line');

    cy.get('[data-testid="SaveIcon"]').click();

    cy.wait('@saveSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });

  it('Can delete snippets', () => {
    cy.get('[data-testid="DeleteIcon"]').click();

    cy.contains('button', 'Delete').click();

    cy.wait('@deleteSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });
});