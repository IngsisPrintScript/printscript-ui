import {
  AUTH0_DOMAIN,
  AUTH0_USERNAME,
  AUTH0_PASSWORD,
  FRONTEND_URL
} from "../../src/utils/constants";

describe('Protected routes (Auth0)', () => {

  it('shows login button when user is unauthenticated', () => {
    cy.visit('/');

    cy.contains('button', 'Log in')
        .should('exist')
        .and('be.visible');
  });

  it('opens Auth0 Universal Login when clicking Log in', () => {
    cy.visit('/');

    cy.contains('button', 'Log in').click();

    // Cross-origin Auth0
    cy.origin(AUTH0_DOMAIN, () => {
      cy.contains('Log in').should('exist');
      cy.contains('button', 'Continue').should('exist');
    });
  });

  it('allows access to protected content when authenticated', () => {
    cy.loginToAuth0(
        AUTH0_USERNAME,
        AUTH0_PASSWORD
    );

    cy.visit('/');

    // Ya no debe pedir login
    cy.contains('button', 'Log in').should('not.exist');

    // La app renderiza normalmente
    cy.contains('Printscript').should('exist');
  });

});