import React, { useState } from "react";

import styles from "../../styles/Profile.module.css";

import {
    useGetUserQuery,
    useUpdateUserMutation,
    useGetFavoritesQuery,
} from "../../features/api/apiSlice";

import {
    useCurrentUser,
    setCurrentUser,
} from "../../utils/auth";

const Profile = () => {
    const currentUser = useCurrentUser();
    const USER_ID = currentUser?.id;

    const {
        data: user,
        isLoading,
        isError,
    } = useGetUserQuery(USER_ID, {
        skip: !USER_ID,
    });

    const { data: favorites = [] } =
        useGetFavoritesQuery(USER_ID, {
            skip: !USER_ID,
        });

    const [updateUser, { isLoading: isSaving }] =
        useUpdateUserMutation();

    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
    });

    React.useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone: user.phone || "",
            });
        }
    }, [user]);

    if (!currentUser) {
        return (
            <div className={styles.message}>
                <h2>Войдите в аккаунт</h2>

                <p>
                    Профиль доступен только
                    авторизованным пользователям.
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
                Загрузка профиля...
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className={styles.message}>
                <h2>Не удалось загрузить профиль</h2>
            </div>
        );
    }

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEdit = () => {
        setEditing(true);
    };

    const handleCancel = () => {
        setForm({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            phone: user.phone || "",
        });

        setEditing(false);
    };

    const handleSave = async (event) => {
        event.preventDefault();

        try {
            const updatedUser = await updateUser({
                id: USER_ID,
                ...form,
            }).unwrap();

            setCurrentUser(updatedUser);
            setEditing(false);
        } catch (error) {
            console.error(
                "Ошибка обновления профиля:",
                error
            );
        }
    };

    const displayName =
        `${user.first_name || ""} ${
            user.last_name || ""
        }`.trim() || user.username;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.label}>
                            АККАУНТ
                        </span>

                        <h1>Мой профиль</h1>

                        <p>
                            Управляйте своими контактными
                            данными.
                        </p>
                    </div>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        <div className={styles.avatar}>
                            {displayName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <h2>{displayName}</h2>

                        <span className={styles.username}>
                            @{user.username}
                        </span>

                        <div className={styles.stats}>
                            <div>
                                <strong>
                                    {favorites.length}
                                </strong>

                                <span>
                                    Избранное
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {user.id}
                                </strong>

                                <span>
                                    ID аккаунта
                                </span>
                            </div>
                        </div>
                    </aside>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2>
                                    Личные данные
                                </h2>

                                <p>
                                    Основная информация
                                    вашего аккаунта.
                                </p>
                            </div>

                            {!editing && (
                                <button
                                    type="button"
                                    className={
                                        styles.editButton
                                    }
                                    onClick={handleEdit}
                                >
                                    Редактировать
                                </button>
                            )}
                        </div>

                        <form
                            onSubmit={handleSave}
                            className={styles.form}
                        >
                            <div className={styles.row}>
                                <div
                                    className={
                                        styles.field
                                    }
                                >
                                    <label>
                                        Имя
                                    </label>

                                    <input
                                        name="first_name"
                                        value={
                                            form.first_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={!editing}
                                        placeholder="Ваше имя"
                                    />
                                </div>

                                <div
                                    className={
                                        styles.field
                                    }
                                >
                                    <label>
                                        Фамилия
                                    </label>

                                    <input
                                        name="last_name"
                                        value={
                                            form.last_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={!editing}
                                        placeholder="Ваша фамилия"
                                    />
                                </div>
                            </div>

                            <div
                                className={styles.field}
                            >
                                <label>
                                    Логин
                                </label>

                                <input
                                    value={
                                        user.username
                                    }
                                    disabled
                                />

                                <span
                                    className={
                                        styles.hint
                                    }
                                >
                                    Логин нельзя изменить.
                                </span>
                            </div>

                            <div
                                className={styles.field}
                            >
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={
                                        handleChange
                                    }
                                    disabled={!editing}
                                    placeholder="example@mail.com"
                                />
                            </div>

                            <div
                                className={styles.field}
                            >
                                <label>
                                    Телефон
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={
                                        handleChange
                                    }
                                    disabled={!editing}
                                    placeholder="+7 700 000 00 00"
                                />
                            </div>

                            {editing && (
                                <div
                                    className={
                                        styles.actions
                                    }
                                >
                                    <button
                                        type="button"
                                        className={
                                            styles.cancel
                                        }
                                        onClick={
                                            handleCancel
                                        }
                                    >
                                        Отмена
                                    </button>

                                    <button
                                        type="submit"
                                        className={
                                            styles.save
                                        }
                                        disabled={isSaving}
                                    >
                                        {isSaving
                                            ? "Сохранение..."
                                            : "Сохранить"}
                                    </button>
                                </div>
                            )}
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Profile;