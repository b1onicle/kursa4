import React, { useState } from "react";
import PropertyCard from "../PropertyCard/PropertyCard";
import Pagination from "../Pagination/Pagination";

import { useGetPropertiesQuery } from "../../features/api/apiSlice";
import styles from "../../styles/PropertyList.module.css";

// Newest listings, optionally paginated.
const PropertyList = ({ pageSize = 12, paginated = true }) => {
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useGetPropertiesQuery({
        ordering: "newest",
        page,
        page_size: pageSize,
    });

    if (isLoading) {
        return <p className={styles.message}>Загружаем объявления…</p>;
    }

    if (error) {
        return (
            <p className={styles.message}>
                Не удалось загрузить объявления. Проверьте, что сервер
                запущен, и обновите страницу.
            </p>
        );
    }

    const properties = data?.results ?? [];
    const totalPages = Math.ceil((data?.count ?? 0) / pageSize);

    if (properties.length === 0) {
        return (
            <p className={styles.message}>
                Объявлений пока нет. Разместите первое.
            </p>
        );
    }

    return (
        <>
            <div className={styles.grid}>
                {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>

            {paginated && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </>
    );
};

export default PropertyList;
