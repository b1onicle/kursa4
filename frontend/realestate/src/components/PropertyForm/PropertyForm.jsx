import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../../styles/PropertyForm.module.css";
import { useCurrentUser } from "../../utils/auth";

import {
    useCreatePropertyMutation,
    useUploadPropertyPhotoMutation,
} from "../../features/api/apiSlice";

const PropertyForm = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    const [createProperty, { isLoading: isCreating }] =
        useCreatePropertyMutation();

    const [uploadPropertyPhoto, { isLoading: isUploading }] =
        useUploadPropertyPhotoMutation();

    const [form, setForm] = useState({
        title: "",
        description: "",
        price: "",
        property_type: "apartment",
        deal_type: "sale",
        city: "",
        address: "",
        area: "",
        rooms: "",
        floor: "",
        total_floors: "",
    });

    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePhotosChange = (e) => {
        const selectedPhotos = Array.from(e.target.files || []);

        if (selectedPhotos.length > 10) {
            setError("Можно выбрать не более 10 фотографий.");
            setPhotos([]);
            e.target.value = "";
            return;
        }

        const invalidFile = selectedPhotos.find(
            (file) =>
                !file.type.startsWith("image/") ||
                file.size > 5 * 1024 * 1024
        );

        if (invalidFile) {
            setError(
                "Выберите изображения размером не более 5 МБ каждое."
            );
            setPhotos([]);
            e.target.value = "";
            return;
        }

        setError("");
        setPhotos(selectedPhotos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!currentUser?.id) {
            navigate("/login");
            return;
        }

        try {
            const payload = {
                ...form,
                owner: currentUser.id,
                price: form.price,
                area: form.area,
                rooms: form.rooms || null,
                floor: form.floor || null,
                total_floors: form.total_floors || null,
            };

            const property = await createProperty(payload).unwrap();

            for (const image of photos) {
                await uploadPropertyPhoto({
                    propertyId: property.id,
                    image,
                }).unwrap();
            }

            navigate(`/properties/${property.id}`);
        } catch (err) {
            console.error("Ошибка создания объявления:", err);

            const responseData = err?.data;

            if (responseData && typeof responseData === "object") {
                const messages = Object.entries(responseData)
                    .map(([field, value]) => {
                        const description = Array.isArray(value)
                            ? value.join(" ")
                            : String(value);

                        return `${field}: ${description}`;
                    })
                    .join("\n");

                setError(
                    messages || "Не удалось создать объявление."
                );
            } else {
                setError(
                    "Не удалось создать объявление. Проверь соединение с сервером."
                );
            }
        }
    };

    const isLoading = isCreating || isUploading;

    if (!currentUser) {
        return (
            <div className={styles.page}>
                <div className={styles.message}>
                    <h1>Войдите в аккаунт</h1>
                    <p>
                        Чтобы разместить объявление,
                        необходимо авторизоваться.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Перейти ко входу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.heading}>
                    <span className={styles.label}>
                        REAL ESTATE / НОВОЕ ОБЪЯВЛЕНИЕ
                    </span>

                    <h1>Расскажите о недвижимости</h1>

                    <p>
                        Заполните информацию об объекте,
                        чтобы добавить его в каталог.
                    </p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleSubmit}
                >
                    <section className={styles.section}>
                        <div className={styles.sectionHeading}>
                            <span>01</span>

                            <div>
                                <h2>Основная информация</h2>
                                <p>
                                    Укажите тип объекта и условия сделки.
                                </p>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="title">
                                Название объявления *
                            </label>

                            <input
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Например, 2-комнатная квартира"
                                maxLength={200}
                                required
                            />
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.field}>
                                <label htmlFor="property_type">
                                    Тип недвижимости *
                                </label>

                                <select
                                    id="property_type"
                                    name="property_type"
                                    value={form.property_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="apartment">
                                        Квартира
                                    </option>

                                    <option value="house">
                                        Дом
                                    </option>

                                    <option value="commercial">
                                        Коммерческая недвижимость
                                    </option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="deal_type">
                                    Тип сделки *
                                </label>

                                <select
                                    id="deal_type"
                                    name="deal_type"
                                    value={form.deal_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="sale">
                                        Продажа
                                    </option>

                                    <option value="rent">
                                        Аренда
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="description">
                                Описание *
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Расскажите об объекте, состоянии ремонта и особенностях..."
                                rows={6}
                                required
                            />
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeading}>
                            <span>02</span>

                            <div>
                                <h2>Стоимость и характеристики</h2>
                                <p>
                                    Основные параметры недвижимости.
                                </p>
                            </div>
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.field}>
                                <label htmlFor="price">
                                    Цена, ₸ *
                                </label>

                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="15000000"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="area">
                                    Площадь, м² *
                                </label>

                                <input
                                    id="area"
                                    name="area"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.area}
                                    onChange={handleChange}
                                    placeholder="65"
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.threeColumns}>
                            <div className={styles.field}>
                                <label htmlFor="rooms">
                                    Комнат
                                </label>

                                <input
                                    id="rooms"
                                    name="rooms"
                                    type="number"
                                    min="1"
                                    value={form.rooms}
                                    onChange={handleChange}
                                    placeholder="2"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="floor">
                                    Этаж
                                </label>

                                <input
                                    id="floor"
                                    name="floor"
                                    type="number"
                                    min="1"
                                    value={form.floor}
                                    onChange={handleChange}
                                    placeholder="3"
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="total_floors">
                                    Этажей в здании
                                </label>

                                <input
                                    id="total_floors"
                                    name="total_floors"
                                    type="number"
                                    min="1"
                                    value={form.total_floors}
                                    onChange={handleChange}
                                    placeholder="9"
                                />
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeading}>
                            <span>03</span>

                            <div>
                                <h2>Местоположение</h2>
                                <p>
                                    Укажите город и адрес объекта.
                                </p>
                            </div>
                        </div>

                        <div className={styles.twoColumns}>
                            <div className={styles.field}>
                                <label htmlFor="city">
                                    Город *
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Караганда"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="address">
                                    Адрес *
                                </label>

                                <input
                                    id="address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Улица, дом"
                                    maxLength={255}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeading}>
                            <span>04</span>

                            <div>
                                <h2>Фотографии</h2>
                                <p>
                                    Добавьте до 10 изображений,
                                    каждое размером до 5 МБ.
                                </p>
                            </div>
                        </div>

                        <label className={styles.uploadArea}>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotosChange}
                            />

                            <span className={styles.uploadIcon}>
                                +
                            </span>

                            <strong>
                                Выберите фотографии
                            </strong>

                            <span>
                                JPG, PNG или WebP
                            </span>
                        </label>

                        {photos.length > 0 && (
                            <div className={styles.photoList}>
                                {photos.map((photo, index) => (
                                    <div
                                        className={styles.photoItem}
                                        key={`${photo.name}-${index}`}
                                    >
                                        <span>{photo.name}</span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPhotos((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== index
                                                    )
                                                )
                                            }
                                            aria-label={`Удалить ${photo.name}`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {error && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className={styles.formFooter}>
                        <p>
                            Поля со звёздочкой обязательны для заполнения.
                        </p>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Публикация..."
                                : "Опубликовать объявление"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PropertyForm;