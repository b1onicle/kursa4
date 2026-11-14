import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { ROUTES } from "../../utils/routes";
import { useCurrentUser } from "../../utils/auth";

import Landing from "../Landing/Landing";
import Home from "../Home/Home";
import PropertyDetail from "../PropertyDetail/PropertyDetail";
import PropertyCatalog from "../PropertyCatalog/PropertyCatalog";
import Favorites from "../Favorites/Favorites";
import Profile from "../Profile/Profile";
import Register from "../Register/Register";
import Login from "../Login/Login";
import PropertyForm from "../PropertyForm/PropertyForm";

const AppRoutes = () => {
    const currentUser = useCurrentUser();

    return (
        <Routes>
            <Route
    path="/properties/create"
    element={
        currentUser
            ? <PropertyForm />
            : <Navigate to="/login" replace />
    }
/>
            {/* Главная зависит от авторизации */}
            <Route
                path="/"
                element={
                    currentUser ? <Home /> : <Landing />
                }
            />

            {/* Доступно всем */}
            <Route
                path={ROUTES.PROPERTIES}
                element={<PropertyCatalog />}
            />

            <Route
                path={ROUTES.PROPERTY}
                element={<PropertyDetail />}
            />

            {/* Доступно только авторизованным */}
            <Route
                path={ROUTES.FAVORITES}
                element={
                    currentUser
                        ? <Favorites />
                        : <Navigate to="/login" replace />
                }
            />

            <Route
                path={ROUTES.PROFILE}
                element={
                    currentUser
                        ? <Profile />
                        : <Navigate to="/login" replace />
                }
            />

            {/* Страницы авторизации */}
            <Route
                path="/register"
                element={
                    currentUser
                        ? <Navigate to="/" replace />
                        : <Register />
                }
            />

            <Route
                path="/login"
                element={
                    currentUser
                        ? <Navigate to="/" replace />
                        : <Login />
                }
            />

            {/* Неизвестные адреса */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
};

export default AppRoutes;