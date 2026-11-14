import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/PropertyCard.module.css";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import FloorGauge from "../FloorGauge/FloorGauge";
import {
    formatArea,
    formatPrice,
    listingKind,
    thumbnailUrl,
    STATUS_LABELS,
} from "../../utils/format";

const PropertyCard = ({ property }) => {
    const photo = thumbnailUrl(property.photos?.[0]);
    const isInactive = property.status && property.status !== "active";

    return (
        <article className={`${styles.card} ${isInactive ? styles.inactive : ""}`}>
            <div className={styles.media}>
                {photo ? (
                    <img src={photo} alt="" loading="lazy" />
                ) : (
                    <span className={styles.noPhoto}>Без фото</span>
                )}

                {isInactive && (
                    <span className={styles.status}>
                        {STATUS_LABELS[property.status]}
                    </span>
                )}

                <FavoriteButton propertyId={property.id} className={styles.favorite} />
            </div>

            <div className={styles.body}>
                <p className={styles.kind}>{listingKind(property)}</p>

                <p className={`${styles.price} num`}>
                    {formatPrice(property.price)}
                    {property.deal_type === "rent" && (
                        <span className={styles.per}> в месяц</span>
                    )}
                </p>

                <h3 className={styles.title}>
                    <Link to={`/properties/${property.id}`}>{property.title}</Link>
                </h3>

                <p className={styles.address}>
                    {property.city}, {property.address}
                </p>

                <div className={styles.specs}>
                    {property.rooms && (
                        <span className="num">{property.rooms} комн.</span>
                    )}
                    <span className="num">{formatArea(property.area)} м²</span>
                    <FloorGauge floor={property.floor} total={property.total_floors} />
                </div>
            </div>
        </article>
    );
};

export default PropertyCard;
