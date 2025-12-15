export function loginViaAuth0Ui(username: string, password: string) {
    const auth0Domain = Cypress.env("AUTH0_DOMAIN");
    expect(auth0Domain).to.be.a("string").and.not.be.empty;

    cy.session(
        [`auth0-${username}`],
        () => {
            // 1️⃣ Ir a la app (dispara redirect a Auth0)
            cy.visit("/");

            // 2️⃣ Login en Auth0 (otro origin)
            cy.origin(
                `https://${auth0Domain}`,
                { args: { username, password } },
                ({ username, password }) => {
                    cy.get('input[type="email"], #username', { timeout: 20000 })
                        .first()
                        .clear()
                        .type(username);

                    cy.get('input[type="password"], #password')
                        .clear()
                        .type(password, { log: false });

                    cy.contains("button", /continue|log in/i).click();
                }
            );

            // 3️⃣ Esperar callback
            cy.location("pathname", { timeout: 20000 })
                .should("include", "/callback");

            // 4️⃣ Esperar que React redirija a /
            cy.location("pathname", { timeout: 20000 })
                .should("eq", "/");

            // 5️⃣ Confirmar app cargada
            cy.get(".MuiTable-root", { timeout: 20000 }).should("be.visible");
        },
        {
            cacheAcrossSpecs: true,
        }
    );
}