import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../../styles/Hero.module.css";
import Facade from "../Facade/Facade";
import { useGetPropertiesQuery } from "../../features/api/apiSlice";
import { listingsCount } from "../../utils/format";

const Hero = () => {
    const navigate = useNavigate();

    const [deal, setDeal] = useState("sale");
    const [type, setType] = useState("all");
    const [search, setSearch] = useState("");

    // Only the total is needed here; one item keeps the response small.
    const { data } = useGetPropertiesQuery({ page_size: 1 });
    const total = data?.count ?? 0;

    const handleSubmit = (event) => {
        event.preventDefault();

        const params = new URLSearchParams({ deal_type: deal });
        if (type !== "all") params.set("property_type", type);
        if (search.trim()) params.set("search", search.trim());

        navigate(`/properties?${params}`);
    };

    return (
        <section className={styles.hero}>
            <div className={styles.text}>
                <h1>Квартиры, дома и помещения на продажу и в аренду</h1>

                <p className={styles.lead}>
                    Ищите по городу и типу жилья, сохраняйте
                    понравившиеся объявления и звоните владельцам
                    напрямую.
                </p>

                <form className={styles.search} onSubmit={handleSubmit}>
                    <div className="segmented" role="radiogroup" aria-label="Тип сделки">
                        <label>
                            <input
                                type="radio"
                                name="deal"
                                value="sale"
                                checked={deal === "sale"}
                                onChange={() => setDeal("sale")}
                            />
                            <span>Купить</span>
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="deal"
                                value="rent"
                                checked={deal === "rent"}
                                onChange={() => setDeal("rent")}
                            />
                            <span>Снять</span>
                        </label>
                    </div>

                    <div className={styles.fields}>
                        <div className="field">
                            <label htmlFor="hero-type">Что ищете</label>
                            <select
                                id="hero-type"
                                className="input"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="all">Любой объект</option>
                                <option value="apartment">Квартира</option>
                                <option value="house">Дом</option>
                                <option value="commercial">Коммерческое помещение</option>
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="hero-search">Город или адрес</label>
                            <input
                                id="hero-search"
                                className="input"
                                type="search"
                                placeholder="Например, Караганда"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={`btn btn-primary ${styles.submit}`}>
                            Показать объявления
                        </button>
                    </div>
                </form>
            </div>

            <figure className={styles.visual}>
                <Facade litCount={total} />

                {total > 0 && (
                    <figcaption>
                        Каждое светящееся окно — одно объявление.
                        Сейчас в каталоге{" "}
                        <strong className="num">{listingsCount(total)}</strong>.
                    </figcaption>
                )}
            </figure>
        </section>
    );
};

export default Hero;
