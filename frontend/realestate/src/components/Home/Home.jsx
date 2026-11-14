import React, { useState } from "react";

import PropertyList from "../PropertyList/PropertyList";
import styles from "../../styles/Home.module.css";

const Home = () => {
    const [propertyType, setPropertyType] = useState("all");
    const [dealType, setDealType] = useState("all");
    const [city, setCity] = useState("");

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroGlow}></div>

                <div className={styles.heroContent}>
                    <div className={styles.eyebrow}>
                        REAL ESTATE PLATFORM
                    </div>

                    <h1>
                        Найдите место,
                        <br />
                        которое станет <span>вашим.</span>
                    </h1>

                    <p className={styles.subtitle}>
                        Квартиры, дома и коммерческая недвижимость
                        <br />
                        в одном удобном сервисе.
                    </p>

                    <div className={styles.search}>
                        <div className={styles.searchField}>
                            <label>Тип недвижимости</label>

                            <select
                                value={propertyType}
                                onChange={(e) =>
                                    setPropertyType(e.target.value)
                                }
                            >
                                <option value="all">
                                    Вся недвижимость
                                </option>
                                <option value="apartment">
                                    Квартиры
                                </option>
                                <option value="house">
                                    Дома
                                </option>
                                <option value="commercial">
                                    Коммерческая недвижимость
                                </option>
                            </select>
                        </div>

                        <div className={styles.searchField}>
                            <label>Тип сделки</label>

                            <select
                                value={dealType}
                                onChange={(e) =>
                                    setDealType(e.target.value)
                                }
                            >
                                <option value="all">
                                    Продажа и аренда
                                </option>
                                <option value="sale">
                                    Продажа
                                </option>
                                <option value="rent">
                                    Аренда
                                </option>
                            </select>
                        </div>

                        <div className={styles.searchField}>
                            <label>Местоположение</label>

                            <input
                                type="text"
                                placeholder="Город или адрес"
                                value={city}
                                onChange={(e) =>
                                    setCity(e.target.value)
                                }
                            />
                        </div>

                        <button type="button">
                            Найти
                        </button>
                    </div>

                    <div className={styles.stats}>
                        <div>
                            <strong>1000+</strong>
                            <span>объявлений</span>
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
                </div>
            </section>

            <section className={styles.properties}>
                <div className={styles.sectionHeader}>
                    <div>
                        <span className={styles.sectionLabel}>
                            НОВЫЕ ОБЪЕКТЫ
                        </span>

                        <h2>Последние объявления</h2>
                    </div>

                    <span className={styles.sectionHint}>
                        Свежие предложения
                    </span>
                </div>

                <PropertyList
                    propertyType={propertyType}
                    dealType={dealType}
                    city={city}
                />
            </section>
        </div>
    );
};

export default Home;