import React from "react";
import { Link, useLocation } from "react-router-dom";

import styles from "../../styles/NotFound.module.css";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const NotFound = () => {
    const { pathname } = useLocation();
    useDocumentTitle("Страница не найдена");

    return (
        <div className={`page ${styles.page}`}>
            {/* An empty facade: no lit windows behind this address. */}
            <div className={styles.facade} aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                    <span key={i} />
                ))}
            </div>

            <div>
                <p className={`${styles.code} num`}>404</p>
                <h1>Такой страницы нет</h1>
                <p className={styles.text}>
                    По адресу <code>{pathname}</code> ничего не нашлось.
                    Возможно, ссылка устарела или в ней опечатка.
                </p>

                <div className={styles.actions}>
                    <Link to="/properties" className="btn btn-primary">
                        Открыть каталог
                    </Link>
                    <Link to="/" className="btn btn-ghost">
                        На главную
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
