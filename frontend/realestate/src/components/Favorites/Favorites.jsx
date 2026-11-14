import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Favorites.module.css";
import PropertyCard from "../PropertyCard/PropertyCard";
import { useGetFavoritesQuery } from "../../features/api/apiSlice";
import { useCurrentUser } from "../../utils/auth";
import { listingsCount } from "../../utils/format";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const Favorites = () => {
    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;
    useDocumentTitle("Избранное");

    const {
        data: favorites = [],
        isLoading,
        isError,
    } = useGetFavoritesQuery(USER_ID, { skip: !USER_ID });

    return (
        <div className="page">
            <header className={styles.header}>
                <h1>Избранное</h1>
                {!isLoading && !isError && (
                    <p className="num">{listingsCount(favorites.length)}</p>
                )}
            </header>

            {isLoading && <p className={styles.message}>Загружаем избранное…</p>}

            {isError && (
                <p className={styles.message}>
                    Избранное не загрузилось. Проверьте, что сервер запущен,
                    и обновите страницу.
                </p>
            )}

            {!isLoading && !isError && favorites.length === 0 && (
                <div className={styles.empty}>
                    <h2>Пока пусто</h2>
                    <p>
                        Нажмите на сердечко на фотографии объявления, и оно
                        появится здесь.
                    </p>
                    <Link to="/properties" className="btn btn-primary">
                        Открыть каталог
                    </Link>
                </div>
            )}

            {favorites.length > 0 && (
                <div className={styles.grid}>
                    {favorites.map((favorite) => (
                        <PropertyCard key={favorite.id} property={favorite.property_data} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
