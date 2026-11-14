import React, { useMemo, useState } from "react";

import styles from "../../styles/PropertyCatalog.module.css";
import PropertyCard from "../PropertyCard/PropertyCard";
import { useGetPropertiesQuery } from "../../features/api/apiSlice";

const PropertyCatalog = () => {
    const { data: properties = [], isLoading, isError } =
        useGetPropertiesQuery();

    const [propertyType, setPropertyType] = useState("all");
    const [dealType, setDealType] = useState("all");
    const [city, setCity] = useState("");
    const [sort, setSort] = useState("newest");

    const filteredProperties = useMemo(() => {
        let result = [...properties];

        if (propertyType !== "all") {
            result = result.filter(
                (property) =>
                    property.property_type === propertyType
            );
        }

        if (dealType !== "all") {
            result = result.filter(
                (property) =>
                    property.deal_type === dealType
            );
        }

        if (city.trim()) {
            result = result.filter((property) =>
                `${property.city} ${property.address}`
                    .toLowerCase()
                    .includes(city.toLowerCase())
            );
        }

        if (sort === "priceAsc") {
            result.sort(
                (a, b) => Number(a.price) - Number(b.price)
            );
        }

        if (sort === "priceDesc") {
            result.sort(
                (a, b) => Number(b.price) - Number(a.price)
            );
        }

        if (sort === "newest") {
            result.sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            );
        }

        return result;
    }, [
        properties,
        propertyType,
        dealType,
        city,
        sort,
    ]);

    const resetFilters = () => {
        setPropertyType("all");
        setDealType("all");
        setCity("");
        setSort("newest");
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <span className={styles.label}>
                        КАТАЛОГ
                    </span>

                    <h1>Все объявления</h1>

                    <p>
                        Найдите подходящую недвижимость
                        среди актуальных предложений.
                    </p>
                </div>

                <div className={styles.count}>
                    {filteredProperties.length} объектов
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.filter}>
                    <label>Тип недвижимости</label>

                    <select
                        value={propertyType}
                        onChange={(e) =>
                            setPropertyType(e.target.value)
                        }
                    >
                        <option value="all">
                            Все типы
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

                <div className={styles.filter}>
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

                <div className={styles.filter}>
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

                <div className={styles.filter}>
                    <label>Сортировка</label>

                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value)
                        }
                    >
                        <option value="newest">
                            Сначала новые
                        </option>
                        <option value="priceAsc">
                            Цена: по возрастанию
                        </option>
                        <option value="priceDesc">
                            Цена: по убыванию
                        </option>
                    </select>
                </div>

                <button
                    type="button"
                    className={styles.reset}
                    onClick={resetFilters}
                >
                    Сбросить
                </button>
            </div>

            {isLoading && (
                <div className={styles.message}>
                    Загрузка объявлений...
                </div>
            )}

            {isError && (
                <div className={styles.message}>
                    Не удалось загрузить объявления.
                </div>
            )}

            {!isLoading &&
                !isError &&
                filteredProperties.length === 0 && (
                    <div className={styles.empty}>
                        <h2>Ничего не найдено</h2>
                        <p>
                            Попробуйте изменить параметры
                            поиска.
                        </p>

                        <button
                            type="button"
                            onClick={resetFilters}
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                )}

            {!isLoading &&
                !isError &&
                filteredProperties.length > 0 && (
                    <div className={styles.grid}>
                        {filteredProperties.map(
                            (property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                />
                            )
                        )}
                    </div>
                )}
        </div>
    );
};

export default PropertyCatalog;