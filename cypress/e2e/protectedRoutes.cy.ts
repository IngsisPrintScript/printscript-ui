import '../support/commands';
import {
  AUTH0_USERNAME,
  AUTH0_PASSWORD,
  AUTH0_DOMAIN
} from "../support/constants";

describe('Protected routes (REAL E2E + Auth0)', () => {

  it('redirects to Auth0 when user is unauthenticated', () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit('/');

    // Cypress espera automáticamente el redirect
    cy.origin(`https://${AUTH0_DOMAIN}`, () => {
      cy.url().should('include', '/u/login');
      cy.contains(/continue|log in/i).should('exist');
    });
  });

  it('shows Auth0 Universal Login page', () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.visit('/');

    cy.origin(`https://${AUTH0_DOMAIN}`, () => {
      cy.get('input[type="email"], #username')
          .should('be.visible');

      cy.get('input[type="password"], #password')
          .should('be.visible');

      cy.contains(/continue|log in/i).should('be.visible');
    });
  });

  it('allows access to protected content when authenticated', () => {
    cy.loginToAuth0(
        AUTH0_USERNAME,
        AUTH0_PASSWORD
    );

    cy.visit('/');

    // Ya no hay redirect
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // App renderizada
    cy.contains('Printscript', { timeout: 20000 }).should('exist');
  });

});