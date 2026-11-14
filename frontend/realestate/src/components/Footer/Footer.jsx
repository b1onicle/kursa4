import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Footer.module.css";
import Logo from "../Logo/Logo";
import { ROUTES } from "../../utils/routes";

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.inner}>
            <div className={styles.brand}>
                <Logo inverted />
                <p>
                    Квартиры, дома и коммерческие помещения
                    на продажу и в аренду.
                </p>
            </div>

            <nav className={styles.links} aria-label="Ссылки в подвале">
                <Link to={ROUTES.PROPERTIES}>Каталог</Link>
                <Link to="/properties/create">Разместить объявление</Link>
                <Link to={ROUTES.FAVORITES}>Избранное</Link>
                <Link to={ROUTES.PROFILE}>Профиль</Link>
            </nav>

            <p className={styles.note}>
                2026
            </p>
        </div>
    </footer>
);

export default Footer;
