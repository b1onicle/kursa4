import React from "react";
import { Link } from "react-router-dom";

import Hero from "../Hero/Hero";
import { useDocumentTitle } from "../../utils/useDocumentTitle";
import PropertyList from "../PropertyList/PropertyList";
import homeStyles from "../../styles/Home.module.css";
import styles from "../../styles/Landing.module.css";

// Home page for guests: search, a few fresh listings and an invitation to sellers.
const Landing = () => {
    // The home page uses the plain site name.
    useDocumentTitle(null);

    return (
        <>
            <Hero />

            <section className={homeStyles.section}>
                <div className={homeStyles.heading}>
                    <h2>Новые объявления</h2>
                    <Link to="/properties" className={homeStyles.more}>
                        Весь каталог
                    </Link>
                </div>

                <PropertyList pageSize={6} paginated={false} />
            </section>

            <section className={styles.sellers}>
                <div className={styles.sellersInner}>
                    <h2>Продаёте или сдаёте?</h2>

                    <ol className={styles.steps}>
                        <li>
                            <strong>Создайте аккаунт</strong>
                            <span>Нужны только логин, почта и пароль.</span>
                        </li>
                        <li>
                            <strong>Опишите объект</strong>
                            <span>Цена, площадь, этаж, адрес и до 10 фотографий.</span>
                        </li>
                        <li>
                            <strong>Ждите звонков</strong>
                            <span>Покупатели увидят ваш телефон на странице объявления.</span>
                        </li>
                    </ol>

                    <Link to="/register" className="btn btn-lamp">
                        Создать аккаунт
                    </Link>
                </div>
            </section>
        </>
    );
};

export default Landing;
