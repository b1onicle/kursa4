import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Logo.module.css";

// Wordmark with a four-pane window; one pane is lit.
const Logo = ({ onClick, inverted = false }) => (
    <Link
        to="/"
        className={`${styles.logo} ${inverted ? styles.inverted : ""}`}
        onClick={onClick}
    >
        <svg
            className={styles.mark}
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <rect x="1" y="1" width="8" height="8" rx="1.5" />
            <rect x="11" y="1" width="8" height="8" rx="1.5" className={styles.lit} />
            <rect x="1" y="11" width="8" height="8" rx="1.5" />
            <rect x="11" y="11" width="8" height="8" rx="1.5" />
        </svg>
        RealEstate
    </Link>
);

export default Logo;
