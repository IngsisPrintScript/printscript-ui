import App from './App.tsx'
import './index.css'
import {createRoot} from "react-dom/client";
import {PaginationProvider} from "./contexts/paginationProvider.tsx";
import {SnackbarProvider} from "./contexts/snackbarProvider.tsx";

createRoot(document.getElementById('root')!).render(
    <PaginationProvider>
        <SnackbarProvider>
            <App />
        </SnackbarProvider>
    </PaginationProvider>
);