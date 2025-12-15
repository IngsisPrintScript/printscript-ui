import './commands';
import { loginViaAuth0Ui } from "./auth-provider-commands/auth0";

Cypress.Commands.add('loginToAuth0', (username: string, password: string) => {
    cy.session(
        [`auth0-${username}`],
        () => {
            loginViaAuth0Ui(username, password);
        },
        {
            validate: () => {
                // Confirmo que estoy en MI ORIGIN (no en Auth0)
                cy.visit('/');
                cy.location('origin', { timeout: 20000 })
                    .should('eq', new URL(Cypress.config('baseUrl')!).origin);

                // Auth0 SPA SDK suele guardar la sesión en una key @@auth0spajs@@...
                cy.window().then((win) => {
                    const key = Object.keys(win.localStorage)
                        .find(k => k.startsWith('@@auth0spajs@@'));
                    expect(key, 'Auth0 session key').to.exist;
                });
            },
            cacheAcrossSpecs: true,
        }
    );
});