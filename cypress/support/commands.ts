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
                        cy.get('button[type="submit"]').click();
                    }
                );
            },
            {
                validate: () => {
                    cy.window().then(win => {
                        const keys = Object.keys(win.localStorage);
                        const authKey = keys.find(k =>
                            k.startsWith('@@auth0spajs@@')
                        );
                        expect(authKey, 'Auth0 session key').to.exist;
                    });
                },
            }
        );
    }
);