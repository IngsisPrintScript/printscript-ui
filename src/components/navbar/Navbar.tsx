import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Code, Rule } from "@mui/icons-material";
import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useInitializeRules } from "../../utils/queries.tsx";

type PageType = {
    title: string;
    path: string;
    icon: ReactNode;
};

const pages: PageType[] = [
    { title: "Snippets", path: "/", icon: <Code /> },
    { title: "Rules", path: "/rules", icon: <Rule /> },
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { isAuthenticated } = useAuth0();
    const { mutateAsync: initializeRules } = useInitializeRules();

    const handleNavigate = async (page: PageType) => {
        if (page.path === "/rules") {
            try {
                await initializeRules();
            } catch (err) {
                console.error("Error initializing rules", err);
            }
        }

        navigate(page.path);
    };

    return (
        <AppBar position="static" elevation={0}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ display: "flex", gap: "24px" }}>

                    {/* LOGO */}
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        sx={{
                            display: { xs: "none", md: "flex" },
                            fontWeight: 700,
                            color: "inherit",
                            textDecoration: "none",
                        }}
                    >
                        Printscript
                    </Typography>

                    {/* NAVIGATION BUTTONS */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: { xs: "none", md: "flex" },
                            gap: "4px",
                        }}
                    >
                        {isAuthenticated &&
                            pages.map((page) => (
                                <Button
                                    key={page.title}
                                    onClick={() => handleNavigate(page)}
                                    sx={{
                                        my: 2,
                                        color: "white",
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "4px",
                                        backgroundColor:
                                            location.pathname === page.path
                                                ? "primary.light"
                                                : "transparent",
                                        "&:hover": {
                                            backgroundColor: "primary.dark",
                                        },
                                    }}
                                >
                                    {page.icon}
                                    <Typography>{page.title}</Typography>
                                </Button>
                            ))}
                    </Box>

                    {/* LOGIN / LOGOUT BUTTONS */}
                    {/* Si ya usabas SessionButtons, lo dejás así */}
                    {/* <SessionButtons /> */}
                </Toolbar>
            </Container>
        </AppBar>
    );
};