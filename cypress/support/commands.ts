Cypress.Commands.add(
    'loginToAuth0',
    (username: string, password: string) => {
        cy.session(
            `auth0-${username}`,
            () => {
                cy.visit('/');

                cy.origin(
                    `https://${Cypress.env('AUTH0_DOMAIN')}`,
                    { args: { username, password } },
                    ({ username, password }) => {
                        cy.get('input[name="username"]').type(username);
                        cy.get('input[name="password"]').type(password, { log: false });
                        cy.contains('button', 'Continue').click();
                    }
                );

                // ⏳ ESPERAR a que Auth0 vuelva a la app
                cy.location('pathname', { timeout: 20000 })
                    .should('not.include', '/callback');
            },
            {
                validate: () => {
                    // ⏳ esperar a que Auth0 escriba el storage
                    cy.window({ timeout: 20000 }).should((win) => {
                        const key = Object.keys(win.localStorage).find(k =>
                            k.startsWith('@@auth0spajs@@')
                        );
                        expect(key, 'Auth0 session key').to.exist;
                    });
                },
            }
        );
    }
);