import React, { useState, useEffect } from "react";

import AppRoutes from "../Routes/Routes";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";

import { useCurrentUser } from "../../utils/auth";

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentUser = useCurrentUser();

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Закрываем меню при выходе из аккаунта
    useEffect(() => {
        if (!currentUser) {
            setSidebarOpen(false);
        }
    }, [currentUser]);

    return (
        <div className="app">
            {currentUser && (
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={closeSidebar}
                />
            )}

            <div className="appContent">
                <Header
                    onMenuClick={toggleSidebar}
                    isMenuOpen={sidebarOpen}
                    isAuthenticated={Boolean(currentUser)}
                />

                <main>
                    <AppRoutes />
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default App;