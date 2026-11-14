import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import styles from "../../styles/PropertyCatalog.module.css";
import PropertyCard from "../PropertyCard/PropertyCard";
import Pagination from "../Pagination/Pagination";
import { useGetPropertiesQuery } from "../../features/api/apiSlice";
import { useDebouncedValue } from "../../utils/useDebouncedValue";
import { listingsCount } from "../../utils/format";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const PAGE_SIZE = 12;

const DEALS = [
    ["all", "Все"],
    ["sale", "Продажа"],
    ["rent", "Аренда"],
];

const ROOM_OPTIONS = [
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4+"],
];

const RANGE_KEYS = ["price_min", "price_max", "area_min", "area_max"];

const readRanges = (params) =>
    Object.fromEntries(RANGE_KEYS.map((key) => [key, params.get(key) || ""]));

// Filters live in the URL, so links from the home page and the back
// button restore them.
const PropertyCatalog = () => {
    const [params, setParams] = useSearchParams();
    useDocumentTitle("Каталог");

    const dealType = params.get("deal_type") || "all";
    const propertyType = params.get("property_type") || "all";
    const sort = params.get("ordering") || "newest";
    const page = Number(params.get("page")) || 1;
    const urlSearch = params.get("search") || "";
    const rooms = (params.get("rooms") || "").split(",").filter(Boolean);
    const urlRanges = readRanges(params);

    const [searchText, setSearchText] = useState(urlSearch);
    const search = useDebouncedValue(searchText.trim());

    // Typed numbers reach the URL (and the server) after a pause.
    const [ranges, setRanges] = useState(urlRanges);
    const debouncedRanges = useDebouncedValue(ranges);

    const extraCount =
        (rooms.length > 0 ? 1 : 0) +
        (urlRanges.price_min || urlRanges.price_max ? 1 : 0) +
        (urlRanges.area_min || urlRanges.area_max ? 1 : 0);

    const [showExtra, setShowExtra] = useState(extraCount > 0);

    const updateParams = (changes, { resetPage = true } = {}) => {
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(changes).forEach(([key, value]) => {
                    if (value) next.set(key, value);
                    else next.delete(key);
                });
                // Any filter change starts from the first page again.
                if (resetPage) next.delete("page");
                return next;
            },
            { replace: resetPage }
        );
    };

    const updateParam = (key, value, defaultValue = "all") =>
        updateParams({ [key]: value === defaultValue ? "" : value });

    useEffect(() => {
        if (search !== urlSearch) updateParam("search", search, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        const changed = RANGE_KEYS.filter(
            (key) => debouncedRanges[key].trim() !== urlRanges[key]
        );
        if (changed.length) {
            updateParams(
                Object.fromEntries(
                    changed.map((key) => [key, debouncedRanges[key].trim()])
                )
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedRanges]);

    const toggleRoom = (value) => {
        const next = rooms.includes(value)
            ? rooms.filter((room) => room !== value)
            : [...rooms, value].sort();
        updateParams({ rooms: next.join(",") });
    };

    const { data, isLoading, isFetching, isError } = useGetPropertiesQuery({
        property_type: propertyType,
        deal_type: dealType,
        search: urlSearch,
        ordering: sort,
        rooms: rooms.join(","),
        ...urlRanges,
        page,
        page_size: PAGE_SIZE,
    });

    const properties = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasFilters =
        dealType !== "all" ||
        propertyType !== "all" ||
        urlSearch ||
        sort !== "newest" ||
        extraCount > 0;

    const resetFilters = () => {
        setSearchText("");
        setRanges(readRanges(new URLSearchParams()));
        setParams({}, { replace: true });
    };

    const rangeInput = (key, placeholder, label) => (
        <input
            className="input num"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder={placeholder}
            aria-label={label}
            value={ranges[key]}
            onChange={(e) => setRanges((prev) => ({ ...prev, [key]: e.target.value }))}
        />
    );

    const changePage = (nextPage) => {
        updateParams(
            { page: nextPage > 1 ? String(nextPage) : "" },
            { resetPage: false }
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="page">
            <header className={styles.header}>
                <h1>Каталог</h1>
                <p className={`${styles.count} num`} aria-live="polite">
                    {isLoading ? "Загружаем…" : listingsCount(totalCount)}
                </p>
            </header>

            <form
                className={styles.filters}
                onSubmit={(event) => event.preventDefault()}
                role="search"
            >
                <div className="segmented" role="radiogroup" aria-label="Тип сделки">
                    {DEALS.map(([value, label]) => (
                        <label key={value}>
                            <input
                                type="radio"
                                name="deal_type"
                                value={value}
                                checked={dealType === value}
                                onChange={() => updateParam("deal_type", value)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>

                <div className="field">
                    <label htmlFor="catalog-type" className="visually-hidden">
                        Тип объекта
                    </label>
                    <select
                        id="catalog-type"
                        className="input"
                        value={propertyType}
                        onChange={(e) => updateParam("property_type", e.target.value)}
                    >
                        <option value="all">Любой объект</option>
                        <option value="apartment">Квартиры</option>
                        <option value="house">Дома</option>
                        <option value="commercial">Коммерческие помещения</option>
                    </select>
                </div>

                <div className={`field ${styles.searchField}`}>
                    <label htmlFor="catalog-search" className="visually-hidden">
                        Город или адрес
                    </label>
                    <input
                        id="catalog-search"
                        className="input"
                        type="search"
                        placeholder="Город или адрес"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <div className="field">
                    <label htmlFor="catalog-sort" className="visually-hidden">
                        Сортировка
                    </label>
                    <select
                        id="catalog-sort"
                        className="input"
                        value={sort}
                        onChange={(e) => updateParam("ordering", e.target.value, "newest")}
                    >
                        <option value="newest">Сначала новые</option>
                        <option value="priceAsc">Сначала дешевле</option>
                        <option value="priceDesc">Сначала дороже</option>
                    </select>
                </div>

                <button
                    type="button"
                    className={`${styles.more} ${showExtra ? styles.moreOpen : ""}`}
                    onClick={() => setShowExtra((prev) => !prev)}
                    aria-expanded={showExtra}
                    aria-controls="catalog-extra"
                >
                    Ещё фильтры
                    {extraCount > 0 && (
                        <span className={styles.badge}>{extraCount}</span>
                    )}
                </button>

                {showExtra && (
                    <div id="catalog-extra" className={styles.extra}>
                        <fieldset className={styles.group}>
                            <legend>Цена, ₸</legend>
                            <div className={styles.range}>
                                {rangeInput("price_min", "от", "Цена от")}
                                <span aria-hidden="true">—</span>
                                {rangeInput("price_max", "до", "Цена до")}
                            </div>
                        </fieldset>

                        <fieldset className={styles.group}>
                            <legend>Комнат</legend>
                            <div className={styles.chips}>
                                {ROOM_OPTIONS.map(([value, label]) => (
                                    <label key={value}>
                                        <input
                                            type="checkbox"
                                            checked={rooms.includes(value)}
                                            onChange={() => toggleRoom(value)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className={styles.group}>
                            <legend>Площадь, м²</legend>
                            <div className={styles.range}>
                                {rangeInput("area_min", "от", "Площадь от")}
                                <span aria-hidden="true">—</span>
                                {rangeInput("area_max", "до", "Площадь до")}
                            </div>
                        </fieldset>

                        {hasFilters && (
                            <button
                                type="button"
                                className={styles.reset}
                                onClick={resetFilters}
                            >
                                Сбросить всё
                            </button>
                        )}
                    </div>
                )}
            </form>

            {isError && (
                <p className={styles.message}>
                    Не удалось загрузить объявления. Проверьте, что сервер
                    запущен, и обновите страницу.
                </p>
            )}

            {!isLoading && !isError && properties.length === 0 && (
                <div className={styles.empty}>
                    <h2>По этим условиям ничего нет</h2>
                    <p>Попробуйте другой город или уберите часть фильтров.</p>
                    {hasFilters && (
                        <button type="button" className="btn btn-ghost" onClick={resetFilters}>
                            Сбросить фильтры
                        </button>
                    )}
                </div>
            )}

            {properties.length > 0 && (
                <div
                    className={`${styles.grid} ${isFetching ? styles.fetching : ""}`}
                    aria-busy={isFetching}
                >
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            )}

            {!isError && (
                <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
            )}
        </div>
    );
};

export default PropertyCatalog;
