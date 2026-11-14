import React, { useState } from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Header.module.css";
import { ROUTES } from "../../utils/routes";
import { useCurrentUser } from "../../utils/auth";

const Header = ({ onMenuClick, isMenuOpen }) => {
    const currentUser = useCurrentUser();
    const [searchValue, setSearchValue] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();

        if (searchValue.trim()) {
            window.location.href =
                `${ROUTES.PROPERTIES}?search=${encodeURIComponent(searchValue.trim())}`;
        }
    };

    // Шапка для неавторизованных пользователей
    if (!currentUser) {
        return (
            <header className={styles.guestHeader}>
                <Link to={ROUTES.HOME} className={styles.logo}>
                    <span className={styles.logoMark}>R</span>
                    <span>RealEstate</span>
                </Link>

                <nav className={styles.guestNavigation}>
                    <Link to={ROUTES.HOME}>
                        Главная
                    </Link>

                    <Link to={ROUTES.PROPERTIES}>
                        Объявления
                    </Link>
                </nav>

                <div className={styles.guestActions}>
                    <Link
                        to="/login"
                        className={styles.loginButton}
                    >
                        Войти
                    </Link>

                    <Link
                        to="/register"
                        className={styles.registerButton}
                    >
                        Регистрация
                    </Link>
                </div>
            </header>
        );
    }

    // Шапка для авторизованных пользователей
    return (
        <header className={styles.header}>
            <button
                type="button"
                className={`${styles.menuButton} ${
                    isMenuOpen ? styles.menuOpen : ""
                }`}
                onClick={onMenuClick}
                aria-label={
                    isMenuOpen
                        ? "Закрыть меню"
                        : "Открыть меню"
                }
                aria-expanded={Boolean(isMenuOpen)}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <Link to={ROUTES.HOME} className={styles.logo}>
                <span className={styles.logoMark}>R</span>
                <span>RealEstate</span>
            </Link>

            <form
                className={styles.form}
                onSubmit={handleSearch}
            >
                <span className={styles.searchIcon}>⌕</span>

                <input
                    type="search"
                    placeholder="Поиск недвижимости..."
                    autoComplete="off"
                    value={searchValue}
                    onChange={(e) =>
                        setSearchValue(e.target.value)
                    }
                />
            </form>

            <div className={styles.rightSide}>
                <Link
    to="/properties/create"
    className={styles.addButton}
>
    + Подать объявление
</Link>

                <Link
                    to={ROUTES.PROFILE}
                    className={styles.profile}
                >
                    {currentUser.first_name ||
                        currentUser.username}
                </Link>
            </div>
        </header>
    );
};

export default Header;