import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import AppRoutes from "../Routes/Routes";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";

import { useCurrentUser } from "../../utils/auth";

const App = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const currentUser = useCurrentUser();
    const { pathname } = useLocation();

    // Close the menu after navigation or logout.
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname, currentUser]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="app">
            <Header
                onMenuClick={() => setMenuOpen((prev) => !prev)}
                isMenuOpen={menuOpen}
            />

            <Sidebar
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
            />

            <main>
                <AppRoutes />
            </main>

            <Footer />
        </div>
    );
};

export default App;
