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
import ForgotPassword from "../PasswordReset/ForgotPassword";
import ResetPassword from "../PasswordReset/ResetPassword";
import NotFound from "../NotFound/NotFound";

const AppRoutes = () => {
    const currentUser = useCurrentUser();

    // Pages for signed-in users send guests to the login page.
    const privatePage = (element) =>
        currentUser ? element : <Navigate to="/login" replace />;

    // Login and registration are not needed once signed in.
    const guestPage = (element) =>
        currentUser ? <Navigate to="/" replace /> : element;

    return (
        <Routes>
            <Route path="/" element={currentUser ? <Home /> : <Landing />} />

            <Route path={ROUTES.PROPERTIES} element={<PropertyCatalog />} />
            <Route path="/properties/create" element={privatePage(<PropertyForm />)} />
            <Route path="/properties/:id/edit" element={privatePage(<PropertyForm />)} />
            <Route path={ROUTES.PROPERTY} element={<PropertyDetail />} />

            <Route path={ROUTES.FAVORITES} element={privatePage(<Favorites />)} />
            <Route path={ROUTES.PROFILE} element={privatePage(<Profile />)} />

            <Route path="/register" element={guestPage(<Register />)} />
            <Route path="/login" element={guestPage(<Login />)} />
            <Route path="/forgot-password" element={guestPage(<ForgotPassword />)} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
