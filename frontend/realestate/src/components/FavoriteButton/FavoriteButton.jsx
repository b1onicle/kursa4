import React from "react";
import { useNavigate } from "react-router-dom";

import styles from "../../styles/FavoriteButton.module.css";
import { useCurrentUser } from "../../utils/auth";
import {
    useGetFavoritesQuery,
    useAddFavoriteMutation,
    useDeleteFavoriteMutation,
} from "../../features/api/apiSlice";

const FavoriteButton = ({ propertyId, className = "" }) => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const userId = currentUser?.id;

    const { data: favorites = [] } = useGetFavoritesQuery(userId, {
        skip: !userId,
    });

    const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation();
    const [deleteFavorite, { isLoading: isDeleting }] = useDeleteFavoriteMutation();

    const favorite = favorites.find((item) => item.property === propertyId);

    const handleClick = async () => {
        if (!userId) {
            navigate("/login");
            return;
        }

        if (favorite) {
            await deleteFavorite(favorite.id);
        } else {
            await addFavorite({ property: propertyId });
        }
    };

    return (
        <button
            type="button"
            className={`${styles.button} ${favorite ? styles.active : ""} ${className}`}
            onClick={handleClick}
            disabled={isAdding || isDeleting}
            aria-pressed={Boolean(favorite)}
            aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
            </svg>
        </button>
    );
};

export default FavoriteButton;
