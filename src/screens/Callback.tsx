import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function CallbackScreen() {
    const { isLoading, isAuthenticated, error } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;

        if (error) {
            console.error("Auth0 callback error:", error);
            return;
        }

        if (isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isLoading, isAuthenticated, error, navigate]);

    return <div>Procesando login...</div>;
}