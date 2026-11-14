import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import styles from "../../styles/PropertyDetail.module.css";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import FloorGauge from "../FloorGauge/FloorGauge";

import {
    useGetPropertyQuery,
    useGetUserQuery,
    useDeletePropertyMutation,
} from "../../features/api/apiSlice";

import { useCurrentUser } from "../../utils/auth";
import {
    formatArea,
    formatPrice,
    listingKind,
    mediaUrl,
    thumbnailUrl,
    STATUS_LABELS,
} from "../../utils/format";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const formatDate = (value) =>
    new Date(value).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).replace(/\s?г\.$/, "");

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;

    const [photoIndex, setPhotoIndex] = useState(0);

    const { data: property, isLoading, isError } = useGetPropertyQuery(id);

    const { data: owner } = useGetUserQuery(property?.owner, {
        skip: !property?.owner,
    });

    const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

    const isOwner = Boolean(USER_ID) && property?.owner === USER_ID;
    useDocumentTitle(property?.title);

    const handleDelete = async () => {
        if (!window.confirm("Удалить объявление? Это действие нельзя отменить.")) {
            return;
        }

        try {
            await deleteProperty(property.id).unwrap();
            navigate("/properties");
        } catch (error) {
            console.error("Ошибка удаления объявления:", error);
            window.alert("Не удалось удалить объявление. Попробуйте ещё раз.");
        }
    };

    if (isLoading) {
        return <div className={`page ${styles.message}`}>Загружаем объявление…</div>;
    }

    if (isError || !property) {
        return (
            <div className={`page ${styles.message}`}>
                <h1>Объявление не найдено</h1>
                <p>Возможно, его удалил владелец.</p>
                <Link to="/properties" className="btn btn-primary">
                    Открыть каталог
                </Link>
            </div>
        );
    }

    const photos = property.photos || [];
    const currentPhoto = photos[Math.min(photoIndex, photos.length - 1)];
    const ownerName = owner
        ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.username
        : "Владелец";
    const isInactive = property.status && property.status !== "active";

    return (
        <div className="page">
            <Link to="/properties" className={styles.back}>
                Назад к каталогу
            </Link>

            <div className={styles.layout}>
                <div className={styles.main}>
                    <section className={styles.gallery} aria-label="Фотографии">
                        <div className={styles.mainImage}>
                            {currentPhoto ? (
                                <img
                                    key={currentPhoto.id}
                                    src={mediaUrl(currentPhoto.image)}
                                    alt={property.title}
                                />
                            ) : (
                                <span className={styles.noPhoto}>
                                    Владелец пока не добавил фотографии
                                </span>
                            )}

                            <FavoriteButton propertyId={property.id} className={styles.favorite} />
                        </div>

                        {photos.length > 1 && (
                            <div className={styles.thumbnails}>
                                {photos.map((photo, index) => (
                                    <button
                                        key={photo.id}
                                        type="button"
                                        className={index === photoIndex ? styles.thumbActive : ""}
                                        onClick={() => setPhotoIndex(index)}
                                        aria-label={`Фото ${index + 1} из ${photos.length}`}
                                        aria-current={index === photoIndex}
                                    >
                                        <img src={thumbnailUrl(photo)} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.description}>
                        <h2>Описание</h2>
                        <p>{property.description}</p>
                    </section>
                </div>

                <aside className={styles.aside}>
                    <p className={styles.kind}>
                        {listingKind(property)}
                        {isInactive && (
                            <span className={styles.status}>
                                {STATUS_LABELS[property.status]}
                            </span>
                        )}
                    </p>

                    <h1 className={styles.title}>{property.title}</h1>

                    <p className={`${styles.price} num`}>
                        {formatPrice(property.price)}
                        {property.deal_type === "rent" && (
                            <span className={styles.per}> в месяц</span>
                        )}
                    </p>

                    <p className={styles.address}>
                        {property.city}, {property.address}
                    </p>

                    <p className={styles.posted}>
                        Размещено {formatDate(property.created_at)}
                    </p>

                    <dl className={styles.specs}>
                        <div>
                            <dt>Площадь</dt>
                            <dd className="num">{formatArea(property.area)} м²</dd>
                        </div>

                        {property.rooms && (
                            <div>
                                <dt>Комнат</dt>
                                <dd className="num">{property.rooms}</dd>
                            </div>
                        )}

                        {property.floor && (
                            <div className={styles.floor}>
                                <dt>Этаж</dt>
                                <dd>
                                    <FloorGauge
                                        floor={property.floor}
                                        total={property.total_floors}
                                        size="large"
                                    />
                                </dd>
                            </div>
                        )}
                    </dl>

                    <div className={styles.owner}>
                        <span className={styles.ownerAvatar} aria-hidden="true">
                            {ownerName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <strong>{ownerName}</strong>
                            <span>{isOwner ? "Это ваше объявление" : "Владелец"}</span>
                        </div>
                    </div>

                    {!isOwner && owner?.phone && (
                        <a href={`tel:${owner.phone}`} className={`btn btn-primary ${styles.call}`}>
                            Позвонить: {owner.phone}
                        </a>
                    )}

                    {!isOwner && owner && !owner.phone && (
                        <p className={styles.noPhone}>Владелец не указал телефон.</p>
                    )}

                    {isOwner && (
                        <div className={styles.ownerActions}>
                            <Link to={`/properties/${property.id}/edit`} className="btn btn-ghost">
                                Редактировать
                            </Link>

                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Удаляем…" : "Удалить"}
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default PropertyDetail;
