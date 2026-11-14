import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Profile.module.css";
import PropertyCard from "../PropertyCard/PropertyCard";
import Pagination from "../Pagination/Pagination";

import {
    useGetMeQuery,
    useUpdateMeMutation,
    useGetFavoritesQuery,
    useGetPropertiesQuery,
} from "../../features/api/apiSlice";

import { useCurrentUser, setCurrentUser } from "../../utils/auth";
import { listingsCount } from "../../utils/format";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const MY_PROPERTIES_PAGE_SIZE = 6;

const CONTACT_FIELDS = [
    ["first_name", "Имя", "text"],
    ["last_name", "Фамилия", "text"],
    ["email", "Email", "email"],
    ["phone", "Телефон", "tel"],
];

const toForm = (user) =>
    Object.fromEntries(CONTACT_FIELDS.map(([name]) => [name, user?.[name] || ""]));

const Profile = () => {
    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;
    useDocumentTitle("Профиль");

    const { data: user, isLoading, isError } = useGetMeQuery(undefined, {
        skip: !USER_ID,
    });

    const { data: favorites = [] } = useGetFavoritesQuery(USER_ID, {
        skip: !USER_ID,
    });

    const [myPropertiesPage, setMyPropertiesPage] = useState(1);

    const { data: myPropertiesData } = useGetPropertiesQuery(
        { owner: USER_ID, page: myPropertiesPage, page_size: MY_PROPERTIES_PAGE_SIZE },
        { skip: !USER_ID }
    );

    const myProperties = myPropertiesData?.results ?? [];
    const myPropertiesCount = myPropertiesData?.count ?? 0;

    const [updateUser, { isLoading: isSaving }] = useUpdateMeMutation();

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(toForm(null));
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) setForm(toForm(user));
    }, [user]);

    if (isLoading) {
        return <div className={`page ${styles.message}`}>Загружаем профиль…</div>;
    }

    if (isError || !user) {
        return (
            <div className={`page ${styles.message}`}>
                <h1>Профиль не загрузился</h1>
                <p>Проверьте, что сервер запущен, и обновите страницу.</p>
            </div>
        );
    }

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setForm(toForm(user));
        setError("");
        setEditing(false);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const updatedUser = await updateUser(form).unwrap();
            setCurrentUser(updatedUser);
            setEditing(false);
        } catch (err) {
            console.error("Ошибка обновления профиля:", err);
            setError("Изменения не сохранены. Проверьте email и попробуйте ещё раз.");
        }
    };

    const displayName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

    return (
        <div className="page">
            <header className={styles.header}>
                <span className={styles.avatar} aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                </span>

                <div>
                    <h1>{displayName}</h1>
                    <p className={styles.meta}>
                        @{user.username}
                        <span className={styles.sep} aria-hidden="true" />
                        <Link to="/favorites" className="num">
                            {favorites.length} в избранном
                        </Link>
                    </p>
                </div>
            </header>

            <div className={styles.layout}>
                <section className={styles.contacts} aria-labelledby="contacts-title">
                    <div className={styles.sectionHead}>
                        <h2 id="contacts-title">Контакты</h2>
                        {!editing && (
                            <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
                                Изменить
                            </button>
                        )}
                    </div>

                    <p className={styles.hint}>
                        Телефон видят покупатели на странице ваших объявлений.
                    </p>

                    {editing ? (
                        <form className={styles.form} onSubmit={handleSave}>
                            {CONTACT_FIELDS.map(([name, label, type]) => (
                                <div className="field" key={name}>
                                    <label htmlFor={`profile-${name}`}>{label}</label>
                                    <input
                                        id={`profile-${name}`}
                                        name={name}
                                        type={type}
                                        className="input"
                                        value={form[name]}
                                        onChange={handleChange}
                                    />
                                </div>
                            ))}

                            {error && (
                                <div className="form-error" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className={styles.actions}>
                                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                                    Отмена
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? "Сохраняем…" : "Сохранить"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <dl className={styles.list}>
                            {CONTACT_FIELDS.map(([name, label]) => (
                                <div key={name}>
                                    <dt>{label}</dt>
                                    <dd className={user[name] ? "" : styles.empty}>
                                        {user[name] || "Не указано"}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </section>

                <section className={styles.listings} aria-labelledby="my-listings-title">
                    <div className={styles.sectionHead}>
                        <div>
                            <h2 id="my-listings-title">Мои объявления</h2>
                            <p className={`${styles.hint} num`}>
                                {listingsCount(myPropertiesCount)}
                            </p>
                        </div>
                    </div>

                    {myProperties.length === 0 ? (
                        <p className={styles.emptyListings}>
                            Здесь появятся ваши объявления.{" "}
                            <Link to="/properties/create">Разместить первое</Link>
                        </p>
                    ) : (
                        <div className={styles.grid}>
                            {myProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}

                    <Pagination
                        page={myPropertiesPage}
                        totalPages={Math.ceil(myPropertiesCount / MY_PROPERTIES_PAGE_SIZE)}
                        onPageChange={setMyPropertiesPage}
                    />
                </section>
            </div>
        </div>
    );
};

export default Profile;
