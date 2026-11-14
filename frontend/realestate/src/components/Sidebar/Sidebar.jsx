import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import styles from "../../styles/Sidebar.module.css";
import { ROUTES } from "../../utils/routes";
import {
    useCurrentUser,
    logoutUser,
} from "../../utils/auth";

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    const handleLogout = () => {
        logoutUser();
        navigate(ROUTES.HOME);
        onClose();
    };

    const handleNavigation = () => {
        onClose();
    };

    return (
        <>
            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={onClose}
                />
            )}

            <aside
                className={`${styles.sidebar} ${
                    isOpen ? styles.open : ""
                }`}
            >
                <div className={styles.logo}>
                    <NavLink
                        to={ROUTES.HOME}
                        onClick={handleNavigation}
                    >
                        <span className={styles.logoMark}>
                            R
                        </span>
                        <span>RealEstate</span>
                    </NavLink>
                </div>

                <nav className={styles.navigation}>
                    <span className={styles.sectionTitle}>
                        МЕНЮ
                    </span>

                    <NavLink
                        to={ROUTES.HOME}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            isActive
                                ? styles.active
                                : ""
                        }
                        end
                    >
                        <span className={styles.icon}>
                            ⌂
                        </span>
                        Главная
                    </NavLink>

                    <NavLink
                        to={ROUTES.PROPERTIES}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            isActive
                                ? styles.active
                                : ""
                        }
                    >
                        <span className={styles.icon}>
                            ▦
                        </span>
                        Объявления
                    </NavLink>

                    <NavLink
                        to={ROUTES.FAVORITES}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            isActive
                                ? styles.active
                                : ""
                        }
                    >
                        <span className={styles.icon}>
                            ♡
                        </span>
                        Избранное
                    </NavLink>
                </nav>

                <div className={styles.divider} />

                <nav className={styles.navigation}>
                    <span className={styles.sectionTitle}>
                        АККАУНТ
                    </span>

                    <NavLink
                        to={ROUTES.PROFILE}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            isActive
                                ? styles.active
                                : ""
                        }
                    >
                        <span className={styles.icon}>
                            ◉
                        </span>
                        Профиль
                    </NavLink>
                </nav>

                <div className={styles.spacer} />

                <NavLink
                    to="/properties/create"
                    onClick={handleNavigation}
                    className={styles.addButton}
                >
                    <span>+</span>
                    Подать объявление
                </NavLink>

                {currentUser ? (
                    <div className={styles.user}>
                        <div className={styles.avatar}>
                            {(
                                currentUser.first_name ||
                                currentUser.username
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className={styles.userInfo}>
                            <strong>
                                {currentUser.first_name ||
                                    currentUser.username}
                            </strong>

                            <span>
                                @{currentUser.username}
                            </span>
                        </div>

                        <button
                            type="button"
                            className={styles.logout}
                            onClick={handleLogout}
                            title="Выйти"
                        >
                            ↪
                        </button>
                    </div>
                ) : (
                    <div className={styles.auth}>
                        <NavLink
                            to="/login"
                            onClick={handleNavigation}
                        >
                            Войти
                        </NavLink>

                        <NavLink
                            to="/register"
                            onClick={handleNavigation}
                        >
                            Регистрация
                        </NavLink>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;