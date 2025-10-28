import './App.css';
import {RouterProvider} from "react-router";
import {createBrowserRouter} from "react-router-dom";
import HomeScreen from "./screens/Home.tsx";
import {QueryClient, QueryClientProvider} from "react-query";
import RulesScreen from "./screens/Rules.tsx";
import { registerTokenGetter } from './auth/tokenProvider.ts';
import {Auth0Provider, useAuth0, withAuthenticationRequired} from '@auth0/auth0-react';
// import {withAuthenticationRequired} from "@auth0/auth0-react";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomeScreen/>
    },
    {
        path: '/rules',
        element: <RulesScreen/>
    }
]);

export const queryClient = new QueryClient()
const ProtectedApp = withAuthenticationRequired(() => {
    const { getAccessTokenSilently } = useAuth0();

    registerTokenGetter(async () => {
        try {
            return await getAccessTokenSilently();
        } catch (error) {
            console.warn('No se pudo obtener el token Auth0:', error);
            return null;
        }
    });

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
});

const App = () => {
    return (
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }}
            cacheLocation="localstorage"
            useRefreshTokens={true}
        >
            <ProtectedApp />
        </Auth0Provider>
    );
};
// To enable Auth0 integration change the following line
export default App;
// for this one:
// export default withAuthenticationRequired(App);
