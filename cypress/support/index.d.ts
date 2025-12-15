declare namespace Cypress {
  interface Chainable {
    loginToAuth0(username: string, password: string): Chainable<void>;
    getAuth0AccessToken(): Chainable<string>;
  }
}
