
import React from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../utils/auth";
import styles from "../../styles/PropertyCard.module.css";
import {
    useGetFavoritesQuery,
    useAddFavoriteMutation,
    useDeleteFavoriteMutation,
} from "../../features/api/apiSlice";


const PropertyCard = ({ property }) => {

    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;

    const {
    data: favorites = [],
} = useGetFavoritesQuery(USER_ID, {
    skip: !USER_ID,
});

    const [addFavorite] = useAddFavoriteMutation();
    const [deleteFavorite] = useDeleteFavoriteMutation();

    const favorite = favorites.find(
        (item) => item.property === property.id
    );

    const handleFavorite = async () => {
        if (favorite) {
            await deleteFavorite(favorite.id);
        } else {
            await addFavorite({
                user: USER_ID,
                property: property.id,
            });
        }
    };

    const photo = property.photos?.[0]?.image;

    return (
        <article className={styles.card}>
            <div className={styles.image}>
                {photo ? (
                    <img
                        src={`http://127.0.0.1:8000${photo}`}
                        alt={property.title}
                    />
                ) : (
                    <span>Нет фото</span>
                )}

                <button
                    className={styles.favorite}
                    onClick={handleFavorite}
                >
                    {favorite ? "♥" : "♡"}
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.price}>
                    {Number(property.price).toLocaleString("ru-RU")} ₸
                </div>

                <h3 className={styles.title}>
                    {property.title}
                </h3>

                <p className={styles.info}>
                    {property.area} м²
                    {property.rooms && ` · ${property.rooms} комн.`}
                    {property.floor &&
                        ` · ${property.floor} этаж`}
                </p>

                <p className={styles.address}>
                    {property.city}, {property.address}
                </p>

                <Link
                    to={`/properties/${property.id}`}
                    className={styles.button}
                >
                    Подробнее
                </Link>
            </div>
        </article>
    );
};

export default PropertyCard;
