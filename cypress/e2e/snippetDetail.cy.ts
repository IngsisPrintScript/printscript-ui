import '../support/commands';
import { BACKEND_URL } from "../support/constants";
import { FakeSnippetStore } from "../../src/utils/mock/fakeSnippetStore";
import {
  AUTH0_USERNAME,
  AUTH0_PASSWORD
} from "../support/constants";

describe('Add snippet tests (LOCAL + Auth0)', () => {

  const fakeStore = new FakeSnippetStore();
  const snippet = fakeStore.listSnippetDescriptors()[0];

  beforeEach(() => {
    cy.loginToAuth0(AUTH0_USERNAME, AUTH0_PASSWORD);

    cy.intercept('POST', '**/snippet/filter*').as('getSnippets');
    cy.intercept('GET', '**/snippet/*').as('getSnippetById');
    cy.intercept('PUT', '**/snippet/*/share').as('shareSnippet');
    cy.intercept('POST', '**/snippet/*/execute').as('runSnippet');
    cy.intercept('GET', '**/rules/format*').as('formatSnippet');
    cy.intercept('PUT', '**/snippet/*/update/text').as('saveSnippet');
    cy.intercept('DELETE', '**/snippet/*').as('deleteSnippet');
    cy.intercept('GET', '**/users*').as('getUsers');

    cy.visit('/');

    cy.wait('@getSnippets');

    cy.get('[data-testid^="snippet-row-"]')
        .first()
        .click();

    cy.wait('@getSnippetById');
  });

  // ─────────────────────────────────────────
  // TESTS
  // ─────────────────────────────────────────

  it('Can share a snippet', () => {
    cy.get('[data-testid="snippet-share-button"]').click();

    cy.contains("Type the user's name")
        .parent()
        .find('input')
        .type('test', { delay: 50 });

    cy.wait('@getUsers');

    cy.get('[role="listbox"] [role="option"]').first().click();

    cy.contains('button', 'Share').click();

    cy.wait('@shareSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });

  it('Can run snippets', () => {
    cy.get('[data-testid="snippet-run-button"]').click();

    cy.wait('@runSnippet');

    cy.get('[data-testid="snippet-output"]')
        .should('exist');
  });

  it('Can format snippets', () => {
    cy.get('[data-testid="snippet-format-button"]').click();

    cy.wait('@formatSnippet');
  });

  it('Can save snippets', () => {
    cy.get('.npm__react-simple-code-editor__textarea')
        .filter(':visible')
        .should('have.length', 1)
        .click()
        .type('{selectall}{backspace}println(2);');

    cy.get('[data-testid="snippet-save-button"]')
        .should('not.be.disabled')
        .click();

    cy.wait('@saveSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });

  it('Can delete snippets', () => {
    cy.get('[data-testid="snippet-delete-button"]').click();

    cy.contains('button', 'Delete').click();

    cy.wait('@deleteSnippet')
        .its('response.statusCode')
        .should('eq', 200);
  });
});
