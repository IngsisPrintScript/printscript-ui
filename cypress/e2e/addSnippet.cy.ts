import { BACKEND_URL } from "../support/constants";

describe('Add snippet tests (REAL E2E)', () => {

  beforeEach(() => {
    cy.loginToAuth0(
        Cypress.env('AUTH0_USERNAME'),
        Cypress.env('AUTH0_PASSWORD')
    );
  });

  it('Can add snippets manually', () => {
    cy.visit('/');

    cy.get('.MuiTable-root', { timeout: 20000 }).should('be.visible');

    cy.intercept('POST', `${BACKEND_URL}/snippets`).as('createSnippet');

    cy.get('[data-testid="open-add-snippet-modal"]').click();
    cy.contains('Create snippet').click();

    cy.get('[data-testid="snippet-name-input"]')
        .should('be.visible')
        .type('Some snippet name');

    cy.get('[data-testid="snippet-language-select"]').click();
    cy.get('ul[role="listbox"]').contains('Printscript').click();

    cy.get('[data-testid="add-snippet-code-editor"]')
        .find('textarea')
        .should('exist')
        .clear({ force: true })
        .type('let sarasa: string = "test";{enter}println(sarasa);', { force: true });

    cy.get('[data-testid="save-snippet-button"]').click();

    cy.wait('@createSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });

  it('Can add snippets via file', () => {
    cy.visit('/');

    cy.get('.MuiTable-root', { timeout: 20000 }).should('be.visible');

    cy.intercept('POST', `${BACKEND_URL}/snippets`).as('createSnippet');

    cy.get('[data-testid="open-add-snippet-modal"]').click();
    cy.contains('Load snippet from file').click();

    cy.get('[data-testid="upload-file-input"]')
        .selectFile('cypress/fixtures/example_ps.pisp', { force: true });

    cy.get('[data-testid="save-snippet-button"]')
        .should('be.enabled')
        .click();

    cy.wait('@createSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });
});