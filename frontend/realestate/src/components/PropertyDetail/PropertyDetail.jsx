import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import styles from "../../styles/PropertyDetail.module.css";

import {
    useGetPropertyQuery,
    useGetFavoritesQuery,
    useAddFavoriteMutation,
    useDeleteFavoriteMutation,
    useGetUserQuery,
} from "../../features/api/apiSlice";

import { useCurrentUser } from "../../utils/auth";

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;

    const {
        data: property,
        isLoading,
        isError,
    } = useGetPropertyQuery(id);

    const { data: owner } = useGetUserQuery(
        property?.owner,
        {
            skip: !property?.owner,
        }
    );

    const { data: favorites = [] } =
        useGetFavoritesQuery(USER_ID, {
            skip: !USER_ID,
        });

    const [addFavorite] = useAddFavoriteMutation();
    const [deleteFavorite] =
        useDeleteFavoriteMutation();

    const favorite = favorites.find(
        (item) => item.property === property?.id
    );

    const handleFavorite = async () => {
        if (!USER_ID) {
            navigate("/login");
            return;
        }

        if (favorite) {
            await deleteFavorite(favorite.id);
        } else {
            await addFavorite({
                user: USER_ID,
                property: property.id,
            });
        }
    };

    if (isLoading) {
        return (
            <div className={styles.message}>
                Загрузка объявления...
            </div>
        );
    }

    if (isError || !property) {
        return (
            <div className={styles.message}>
                <h2>Объявление не найдено</h2>

                <Link
                    to="/properties"
                    className={styles.backButton}
                >
                    Вернуться к объявлениям
                </Link>
            </div>
        );
    }

    const photos = property.photos || [];

    const propertyType = {
        apartment: "Квартира",
        house: "Дом",
        commercial:
            "Коммерческая недвижимость",
    };

    const dealType = {
        sale: "Продажа",
        rent: "Аренда",
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Link
                    to="/properties"
                    className={styles.back}
                >
                    ← Все объявления
                </Link>

                <div className={styles.layout}>
                    <section className={styles.gallery}>
                        <div className={styles.mainImage}>
                            {photos.length > 0 ? (
                                <img
                                    src={`http://127.0.0.1:8000${photos[0].image}`}
                                    alt={property.title}
                                />
                            ) : (
                                <span>
                                    Нет фотографий
                                </span>
                            )}

                            <button
                                type="button"
                                className={`${styles.favorite} ${
                                    favorite
                                        ? styles.favoriteActive
                                        : ""
                                }`}
                                onClick={handleFavorite}
                            >
                                {favorite ? "♥" : "♡"}
                            </button>
                        </div>

                        {photos.length > 1 && (
                            <div
                                className={
                                    styles.thumbnails
                                }
                            >
                                {photos
                                    .slice(1, 4)
                                    .map((photo) => (
                                        <div
                                            key={photo.id}
                                            className={
                                                styles.thumbnail
                                            }
                                        >
                                            <img
                                                src={`http://127.0.0.1:8000${photo.image}`}
                                                alt=""
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.info}>
                        <div className={styles.tags}>
                            <span>
                                {
                                    propertyType[
                                        property
                                            .property_type
                                    ]
                                }
                            </span>

                            <span>
                                {
                                    dealType[
                                        property.deal_type
                                    ]
                                }
                            </span>
                        </div>

                        <h1>{property.title}</h1>

                        <div className={styles.price}>
                            {Number(
                                property.price
                            ).toLocaleString(
                                "ru-RU"
                            )}{" "}
                            ₸
                        </div>

                        <div className={styles.address}>
                            <span>⌖</span>

                            <div>
                                <strong>
                                    {property.city}
                                </strong>

                                <p>
                                    {
                                        property.address
                                    }
                                </p>
                            </div>
                        </div>

                        <div className={styles.details}>
                            <div>
                                <span>Площадь</span>
                                <strong>
                                    {property.area} м²
                                </strong>
                            </div>

                            {property.rooms && (
                                <div>
                                    <span>
                                        Комнаты
                                    </span>
                                    <strong>
                                        {
                                            property.rooms
                                        }
                                    </strong>
                                </div>
                            )}

                            {property.floor && (
                                <div>
                                    <span>
                                        Этаж
                                    </span>
                                    <strong>
                                        {
                                            property.floor
                                        }
                                        {property.total_floors &&
                                            ` / ${property.total_floors}`}
                                    </strong>
                                </div>
                            )}
                        </div>

                        <div className={styles.description}>
                            <h2>Описание</h2>

                            <p>
                                {
                                    property.description
                                }
                            </p>
                        </div>

                        <div className={styles.owner}>
                            <div
                                className={
                                    styles.ownerAvatar
                                }
                            >
                                {(
                                    owner?.first_name ||
                                    owner?.username ||
                                    "U"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <span>
                                    Объявление
                                    размещено
                                </span>

                                <strong>
                                    {owner
                                        ? `${owner.first_name || ""} ${
                                              owner.last_name ||
                                              ""
                                          }`.trim() ||
                                          owner.username
                                        : "Пользователь"}
                                </strong>
                            </div>
                        </div>

                        {owner?.phone && (
                            <a
                                href={`tel:${owner.phone}`}
                                className={
                                    styles.contact
                                }
                            >
                                Позвонить продавцу
                            </a>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;