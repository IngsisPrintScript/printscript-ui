let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Registra una función que sabe cómo obtener el access token de Auth0.
 * Ejemplo: () => getAccessTokenSilently()
 */
export function registerTokenGetter(fn: () => Promise<string | null>) {
    tokenGetter = fn;
}

/** Retorna el token JWT actual si está disponible. */
export async function getToken(): Promise<string | null> {
    if (tokenGetter) {
        return await tokenGetter();
    }
    return null;
}