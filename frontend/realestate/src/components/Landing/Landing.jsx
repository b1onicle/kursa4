import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Landing.module.css";
import { ROUTES } from "../../utils/routes";

const Landing = () => {
    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <span className={styles.label}>
                        REAL ESTATE PLATFORM
                    </span>

                    <h1>
                        Найдите место,
                        <br />
                        которое станет <span>вашим.</span>
                    </h1>

                    <p className={styles.description}>
                        Квартиры, дома и коммерческая недвижимость
                        <br />
                        в одном удобном сервисе.
                    </p>

                    <div className={styles.actions}>
                        <Link
                            to={ROUTES.PROPERTIES}
                            className={styles.primaryButton}
                        >
                            Найти недвижимость
                            <span>→</span>
                        </Link>

                        <Link
                            to="/register"
                            className={styles.secondaryButton}
                        >
                            Разместить объявление
                        </Link>
                    </div>
                </div>

                <div className={styles.heroInfo}>
                    <div>
                        <strong>1000+</strong>
                        <span>объектов</span>
                    </div>

                    <div>
                        <strong>24/7</strong>
                        <span>доступ к сервису</span>
                    </div>

                    <div>
                        <strong>3</strong>
                        <span>категории</span>
                    </div>
                </div>
            </section>

            <section className={styles.features}>
                <div className={styles.sectionHeader}>
                    <span className={styles.label}>
                        ПОЧЕМУ REAL ESTATE
                    </span>

                    <h2>
                        Всё необходимое
                        <br />
                        для поиска недвижимости
                    </h2>
                </div>

                <div className={styles.featureGrid}>
                    <article className={styles.feature}>
                        <span className={styles.number}>01</span>

                        <h3>Большой выбор</h3>

                        <p>
                            Квартиры, дома и коммерческие
                            объекты в одном месте.
                        </p>
                    </article>

                    <article className={styles.feature}>
                        <span className={styles.number}>02</span>

                        <h3>Удобный поиск</h3>

                        <p>
                            Фильтруйте объявления по типу,
                            цене, городу и другим параметрам.
                        </p>
                    </article>

                    <article className={styles.feature}>
                        <span className={styles.number}>03</span>

                        <h3>Свои объявления</h3>

                        <p>
                            Размещайте собственные объекты
                            и находите заинтересованных покупателей.
                        </p>
                    </article>
                </div>
            </section>

            <section className={styles.bottomCta}>
                <div>
                    <span className={styles.label}>
                        НАЧНИТЕ ПРЯМО СЕЙЧАС
                    </span>

                    <h2>
                        Ваш следующий адрес
                        <br />
                        может быть здесь.
                    </h2>
                </div>

                <Link
                    to={ROUTES.PROPERTIES}
                    className={styles.primaryButton}
                >
                    Смотреть объявления
                    <span>→</span>
                </Link>
            </section>
        </div>
    );
};

export default Landing;
