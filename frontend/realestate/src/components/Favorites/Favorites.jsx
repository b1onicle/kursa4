import React from "react";

import styles from "../../styles/Favorites.module.css";
import PropertyCard from "../PropertyCard/PropertyCard";
import { useGetFavoritesQuery } from "../../features/api/apiSlice";
import { useCurrentUser } from "../../utils/auth";

const Favorites = () => {
    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;

    const {
        data: favorites = [],
        isLoading,
        isError,
    } = useGetFavoritesQuery(USER_ID, {
        skip: !USER_ID,
    });

    if (!currentUser) {
        return (
            <div className={styles.message}>
                <div className={styles.messageIcon}>♡</div>

                <h2>Войдите в аккаунт</h2>

                <p>
                    Чтобы сохранять понравившиеся
                    объявления в избранное.
                </p>

                <a href="/login" className={styles.button}>
                    Войти
                </a>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={styles.message}>
                Загрузка избранного...
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.message}>
                <h2>Не удалось загрузить избранное</h2>

                <p>
                    Попробуйте обновить страницу.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <span className={styles.label}>
                        ВАШИ СОХРАНЕНИЯ
                    </span>

                    <h1>Избранное</h1>

                    <p>
                        Объявления, которые вы сохранили.
                    </p>
                </div>

                <span className={styles.count}>
                    {favorites.length} объектов
                </span>
            </div>

            {favorites.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        ♡
                    </div>

                    <h2>
                        Здесь пока ничего нет
                    </h2>

                    <p>
                        Добавляйте понравившиеся
                        объявления, нажимая на сердечко.
                    </p>

                    <a
                        href="/properties"
                        className={styles.button}
                    >
                        Смотреть объявления
                    </a>
                </div>
            ) : (
                <div className={styles.grid}>
                    {favorites.map((favorite) => (
                        <PropertyCard
                            key={favorite.id}
                            property={favorite.property_data}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;