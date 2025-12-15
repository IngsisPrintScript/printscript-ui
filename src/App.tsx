import './App.css';
import { RouterProvider } from "react-router";
import {createBrowserRouter, Outlet} from "react-router-dom";
import HomeScreen from "./screens/Home.tsx";
import { QueryClient, QueryClientProvider } from "react-query";
import RulesScreen from "./screens/Rules.tsx";
import { registerTokenGetter } from './auth/tokenProvider.ts';
import {
    Auth0Provider,
    useAuth0,
    withAuthenticationRequired
} from '@auth0/auth0-react';
import CallbackScreen from "./screens/Callback.tsx";

const ProtectedApp = withAuthenticationRequired(() => {
    const { getAccessTokenSilently } = useAuth0();

    registerTokenGetter(async () => {
        return await getAccessTokenSilently({
            authorizationParams: {
                audience: "https://snippet-search-ingsis",
            },
        });
    });

    return <Outlet />;
});

const router = createBrowserRouter([
    {
        path: "/callback",
        element: <CallbackScreen />,
    },
    {
        element: <ProtectedApp />,
        children: [
            { path: "/", element: <HomeScreen /> },
            { path: "/rules", element: <RulesScreen /> },
        ],
    },
]);

export const queryClient = new QueryClient();

const App = () => {
    console.log("AUTH0 DOMAIN:", import.meta.env.VITE_AUTH0_DOMAIN);
    console.log("AUTH0 CLIENT:", import.meta.env.VITE_AUTH0_CLIENT_ID);
    return (

        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin + "/callback",
                audience: "https://snippet-search-ingsis",
                scope: "openid profile email offline_access",
            }}
            cacheLocation="localstorage"
            useRefreshTokens={true}
        >
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </Auth0Provider>
    );
};

export default App;