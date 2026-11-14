import React from "react";

import styles from "../../styles/Pagination.module.css";

const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav className={styles.pagination} aria-label="Страницы">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                Назад
            </button>

            <span>
                Страница {page} из {totalPages}
            </span>

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                Вперёд
            </button>
        </nav>
    );
};

export default Pagination;
