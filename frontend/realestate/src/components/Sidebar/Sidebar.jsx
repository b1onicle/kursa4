import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";

import styles from "../../styles/Sidebar.module.css";
import { ROUTES } from "../../utils/routes";
import { useCurrentUser, logoutUser } from "../../utils/auth";
import { apiSlice, useLogoutMutation } from "../../features/api/apiSlice";

const linkClass = ({ isActive }) => (isActive ? styles.active : "");

// Slide-in menu: account actions on desktop, the whole navigation on mobile.
const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const currentUser = useCurrentUser();
    const [logout] = useLogoutMutation();

    useEffect(() => {
        if (!isOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    const handleLogout = async () => {
        // Revoke the token on the server; sign out locally even if it fails.
        await logout().unwrap().catch(() => {});
        logoutUser();
        dispatch(apiSlice.util.resetApiState());
        navigate(ROUTES.HOME);
    };

    const name = currentUser
        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
          currentUser.username
        : "";

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.visible : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
                aria-label="Меню"
                aria-hidden={!isOpen}
                inert={isOpen ? undefined : ""}
            >
                {currentUser && (
                    <div className={styles.user}>
                        <span className={styles.avatar}>
                            {name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <strong>{name}</strong>
                            <span>@{currentUser.username}</span>
                        </div>
                    </div>
                )}

                <nav className={styles.links}>
                    <NavLink to={ROUTES.HOME} className={linkClass} end>
                        Главная
                    </NavLink>

                    <NavLink to={ROUTES.PROPERTIES} className={linkClass} end>
                        Каталог
                    </NavLink>

                    {currentUser && (
                        <>
                            <NavLink to={ROUTES.FAVORITES} className={linkClass}>
                                Избранное
                            </NavLink>

                            <NavLink to={ROUTES.PROFILE} className={linkClass}>
                                Профиль и мои объявления
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className={styles.bottom}>
                    {currentUser ? (
                        <>
                            <Link
                                to="/properties/create"
                                className="btn btn-lamp"
                            >
                                Разместить объявление
                            </Link>

                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleLogout}
                            >
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="btn btn-primary">
                                Регистрация
                            </Link>

                            <Link to="/login" className="btn btn-ghost">
                                Войти
                            </Link>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
