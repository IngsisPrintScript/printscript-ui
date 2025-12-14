export function loginViaAuth0Ui(username: string, password: string) {
    const auth0Domain = Cypress.env('AUTH0_DOMAIN');
    expect(auth0Domain, 'AUTH0_DOMAIN must be defined')
        .to.be.a('string')
        .and.not.be.empty;

    cy.visit('/');

    cy.origin(
        `https://${auth0Domain}`,
        { args: { username, password } },
        ({ username, password }) => {
            cy.get('#username').type(username);
            cy.get('#password').type(password, { log: false });
            cy.contains('button', 'Continue').click();
        }
    );

    // Esperar volver a tu app y que termine el callback
    cy.location('origin', { timeout: 20000 })
        .should('eq', new URL(Cypress.config('baseUrl')!).origin);

    cy.location('pathname', { timeout: 20000 })
        .should('not.include', '/callback');
}