import React from "react";
import { Link } from "react-router-dom";

import Hero from "../Hero/Hero";
import { useDocumentTitle } from "../../utils/useDocumentTitle";
import PropertyList from "../PropertyList/PropertyList";
import styles from "../../styles/Home.module.css";

// Home page for signed-in users: search and the newest listings.
const Home = () => {
    // The home page uses the plain site name.
    useDocumentTitle(null);

    return (
        <>
            <Hero />

            <section className={styles.section}>
                <div className={styles.heading}>
                    <h2>Новые объявления</h2>
                    <Link to="/properties" className={styles.more}>
                        Весь каталог
                    </Link>
                </div>

                <PropertyList />
            </section>
        </>
    );
};

export default Home;
