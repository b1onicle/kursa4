import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Footer.module.css";
import { ROUTES } from "../../utils/routes";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <Link
                            to={ROUTES.HOME}
                            className={styles.logo}
                        >
                            <span className={styles.logoMark}>
                                R
                            </span>

                            <span>RealEstate</span>
                        </Link>

                        <p>
                            Современная платформа для поиска
                            недвижимости.
                        </p>
                    </div>

                    <div className={styles.links}>
                        <div>
                            <span className={styles.title}>
                                Навигация
                            </span>

                            <Link to={ROUTES.HOME}>
                                Главная
                            </Link>

                            <Link to={ROUTES.PROPERTIES}>
                                Объявления
                            </Link>

                            <Link to={ROUTES.FAVORITES}>
                                Избранное
                            </Link>
                        </div>

                        <div>
                            <span className={styles.title}>
                                Аккаунт
                            </span>

                            <Link to={ROUTES.PROFILE}>
                                Профиль
                            </Link>

                            <Link to="/login">
                                Войти
                            </Link>

                            <Link to="/register">
                                Регистрация
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <span>
                        © 2026 RealEstate
                    </span>

                    <span>
                        Сделано для учебного проекта
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;