
import React from "react";
import PropertyCard from "../PropertyCard/PropertyCard";

import { useGetPropertiesQuery } from "../../features/api/apiSlice";
import styles from "../../styles/PropertyList.module.css";

const PropertyList = ({ propertyType, dealType, city }) => {
    const {
        data: properties = [],
        isLoading,
        error,
    } = useGetPropertiesQuery();

    if (isLoading) {
        return <p>Загрузка объявлений...</p>;
    }

    if (error) {
        return <p>Ошибка загрузки объявлений.</p>;
    }

    const filteredProperties = properties.filter((property) => {
        const matchesType =
            propertyType === "all" ||
            property.property_type === propertyType;

        const matchesDeal =
            dealType === "all" ||
            property.deal_type === dealType;

        const searchCity = city.trim().toLowerCase();

        const matchesCity =
            !searchCity ||
            property.city.toLowerCase().includes(searchCity) ||
            property.address.toLowerCase().includes(searchCity);

        return matchesType && matchesDeal && matchesCity;
    });

    return (
        <div className={styles.list}>
            {filteredProperties.length === 0 ? (
                <p>Объявлений по вашему запросу не найдено.</p>
            ) : (
                filteredProperties.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                    />
                ))
            )}
        </div>
    );
};

export default PropertyList;
