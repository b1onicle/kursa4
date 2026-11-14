import React from "react";
import { Link, NavLink } from "react-router-dom";

import styles from "../../styles/Header.module.css";
import Logo from "../Logo/Logo";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { ROUTES } from "../../utils/routes";
import { useCurrentUser } from "../../utils/auth";

const navClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.active : ""}`;

const Header = ({ onMenuClick, isMenuOpen }) => {
    const currentUser = useCurrentUser();
    const name = currentUser?.first_name || currentUser?.username;

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <Logo />

                <nav className={styles.nav} aria-label="Основное меню">
                    <NavLink to={ROUTES.PROPERTIES} className={navClass} end>
                        Каталог
                    </NavLink>

                    {currentUser && (
                        <NavLink to={ROUTES.FAVORITES} className={navClass}>
                            Избранное
                        </NavLink>
                    )}
                </nav>

                <div className={styles.actions}>
                    <ThemeToggle />

                    {currentUser ? (
                        <>
                            <Link
                                to="/properties/create"
                                className={`btn btn-lamp ${styles.create}`}
                            >
                                Разместить объявление
                            </Link>

                            <button
                                type="button"
                                className={styles.avatar}
                                onClick={onMenuClick}
                                aria-label="Меню аккаунта"
                                aria-expanded={isMenuOpen}
                                title={name}
                            >
                                {name.charAt(0).toUpperCase()}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={styles.login}>
                                Войти
                            </Link>

                            <Link
                                to="/register"
                                className={`btn btn-primary ${styles.register}`}
                            >
                                Регистрация
                            </Link>
                        </>
                    )}

                    <button
                        type="button"
                        className={`${styles.burger} ${
                            isMenuOpen ? styles.burgerOpen : ""
                        }`}
                        onClick={onMenuClick}
                        aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                        aria-expanded={isMenuOpen}
                    >
                        <span />
                        <span />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
