import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import styles from "../../styles/PropertyForm.module.css";
import { useCurrentUser } from "../../utils/auth";

import {
    useCreatePropertyMutation,
    useUpdatePropertyMutation,
    useGetPropertyQuery,
    useUploadPropertyPhotoMutation,
    useReorderPhotosMutation,
    useDeletePhotoMutation,
} from "../../features/api/apiSlice";
import { thumbnailUrl } from "../../utils/format";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const FORM_FIELDS = [
    "title",
    "description",
    "price",
    "property_type",
    "deal_type",
    "city",
    "address",
    "area",
    "rooms",
    "floor",
    "total_floors",
    "status",
];

// Server field names shown to people in error messages.
const FIELD_LABELS = {
    title: "Название",
    description: "Описание",
    price: "Цена",
    property_type: "Тип объекта",
    deal_type: "Тип сделки",
    city: "Город",
    address: "Адрес",
    area: "Площадь",
    rooms: "Комнат",
    floor: "Этаж",
    total_floors: "Этажей в доме",
    status: "Статус",
    image: "Фото",
};

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const Choice = ({ name, value, current, label, onChange }) => (
    <label>
        <input
            type="radio"
            name={name}
            value={value}
            checked={current === value}
            onChange={onChange}
        />
        <span>{label}</span>
    </label>
);

const PropertyForm = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    // When the route has an id, the form edits an existing property.
    const { id } = useParams();
    const isEditMode = Boolean(id);
    useDocumentTitle(isEditMode ? "Редактирование объявления" : "Новое объявление");

    const {
        data: existingProperty,
        isLoading: isLoadingProperty,
        isError: isPropertyError,
    } = useGetPropertyQuery(id, { skip: !isEditMode });

    const [createProperty, { isLoading: isCreating }] = useCreatePropertyMutation();
    const [updateProperty, { isLoading: isUpdating }] = useUpdatePropertyMutation();
    const [uploadPropertyPhoto, { isLoading: isUploading }] =
        useUploadPropertyPhotoMutation();
    const [reorderPhotos, { isLoading: isReordering }] = useReorderPhotosMutation();
    const [deletePhoto, { isLoading: isDeletingPhoto }] = useDeletePhotoMutation();

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
        status: "active",
    });

    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState("");

    // Fill the form once: photo actions refetch the listing, and refilling
    // would wipe edits the user has not saved yet.
    const filled = useRef(false);

    useEffect(() => {
        if (existingProperty && !filled.current) {
            filled.current = true;
            setForm(
                Object.fromEntries(
                    FORM_FIELDS.map((field) => [field, existingProperty[field] ?? ""])
                )
            );
        }
    }, [existingProperty]);

    const previews = useMemo(
        () => photos.map((file) => URL.createObjectURL(file)),
        [photos]
    );

    useEffect(
        () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
        [previews]
    );

    const savedPhotos = existingProperty?.photos ?? [];
    const slotsLeft = MAX_PHOTOS - savedPhotos.length - photos.length;
    const photoBusy = isReordering || isDeletingPhoto;

    // Saved photos change right away; the first one is the cover.
    const applyOrder = async (ids) => {
        setError("");
        try {
            await reorderPhotos({ propertyId: id, ids }).unwrap();
        } catch {
            setError("Порядок фото не сохранился. Попробуйте ещё раз.");
        }
    };

    const moveSavedPhoto = (index, step) => {
        const ids = savedPhotos.map((photo) => photo.id);
        const target = index + step;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        applyOrder(ids);
    };

    const makeCover = (index) => {
        const ids = savedPhotos.map((photo) => photo.id);
        const [cover] = ids.splice(index, 1);
        applyOrder([cover, ...ids]);
    };

    const removeSavedPhoto = async (photo) => {
        if (!window.confirm("Удалить это фото? Его нельзя будет вернуть.")) return;

        setError("");
        try {
            await deletePhoto(photo.id).unwrap();
        } catch {
            setError("Фото не удалилось. Попробуйте ещё раз.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotosChange = (e) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = "";

        const invalid = selected.find(
            (file) => !file.type.startsWith("image/") || file.size > MAX_PHOTO_SIZE
        );

        if (invalid) {
            setError(`Файл «${invalid.name}» не подходит: нужно изображение до 5 МБ.`);
            return;
        }

        const next = [...photos, ...selected];

        if (next.length + savedPhotos.length > MAX_PHOTOS) {
            setError(
                `У объявления может быть не больше ${MAX_PHOTOS} фотографий. ` +
                    `Можно добавить ещё ${Math.max(0, slotsLeft)}.`
            );
            return;
        }

        setError("");
        setPhotos(next);
    };

    const removePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
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
                rooms: form.rooms || null,
                floor: form.floor || null,
                total_floors: form.total_floors || null,
            };

            const property = isEditMode
                ? await updateProperty({ id, ...payload }).unwrap()
                : await createProperty(payload).unwrap();

            for (const image of photos) {
                await uploadPropertyPhoto({ propertyId: property.id, image }).unwrap();
            }

            navigate(`/properties/${property.id}`);
        } catch (err) {
            console.error("Ошибка сохранения объявления:", err);

            const responseData = err?.data;

            if (responseData && typeof responseData === "object") {
                const messages = Object.entries(responseData)
                    .map(([field, value]) => {
                        const text = Array.isArray(value) ? value.join(" ") : String(value);
                        return `${FIELD_LABELS[field] || field}: ${text}`;
                    })
                    .join("\n");

                setError(messages || "Объявление не сохранено. Проверьте поля формы.");
            } else {
                setError("Объявление не сохранено: сервер не отвечает. Проверьте, что бэкенд запущен.");
            }
        }
    };

    const isSaving = isCreating || isUpdating || isUploading;

    if (!currentUser) {
        return (
            <div className={`page ${styles.message}`}>
                <h1>Войдите, чтобы разместить объявление</h1>
                <Link to="/login" className="btn btn-primary">
                    Войти
                </Link>
            </div>
        );
    }

    if (isEditMode && isLoadingProperty) {
        return <div className={`page ${styles.message}`}>Загружаем объявление…</div>;
    }

    if (
        isEditMode &&
        (isPropertyError || !existingProperty || existingProperty.owner !== currentUser.id)
    ) {
        return (
            <div className={`page ${styles.message}`}>
                <h1>Это объявление нельзя редактировать</h1>
                <p>Оно не найдено или принадлежит другому пользователю.</p>
                <Link to="/properties" className="btn btn-primary">
                    Открыть каталог
                </Link>
            </div>
        );
    }

    const isApartment = form.property_type === "apartment";

    return (
        <div className={`page ${styles.page}`}>
            <h1 className={styles.heading}>
                {isEditMode ? "Редактирование объявления" : "Новое объявление"}
            </h1>

            <form className={styles.form} onSubmit={handleSubmit}>
                <fieldset className={styles.section}>
                    <legend>Что сдаёте или продаёте</legend>

                    <div className={styles.choices}>
                        <div className="segmented" role="radiogroup" aria-label="Тип объекта">
                            <Choice name="property_type" value="apartment" label="Квартира" current={form.property_type} onChange={handleChange} />
                            <Choice name="property_type" value="house" label="Дом" current={form.property_type} onChange={handleChange} />
                            <Choice name="property_type" value="commercial" label="Помещение" current={form.property_type} onChange={handleChange} />
                        </div>

                        <div className="segmented" role="radiogroup" aria-label="Тип сделки">
                            <Choice name="deal_type" value="sale" label="Продажа" current={form.deal_type} onChange={handleChange} />
                            <Choice name="deal_type" value="rent" label="Аренда" current={form.deal_type} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="title">Название</label>
                        <input
                            id="title"
                            name="title"
                            className="input"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Например, двухкомнатная у парка"
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"
                            name="description"
                            className="input"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Состояние ремонта, что рядом, что остаётся в квартире"
                            rows={6}
                            required
                        />
                    </div>

                    {isEditMode && (
                        <div className="field">
                            <span className="field-label">Статус</span>
                            <div className="segmented" role="radiogroup" aria-label="Статус">
                                <Choice name="status" value="active" label="Активно" current={form.status} onChange={handleChange} />
                                <Choice name="status" value="sold" label={form.deal_type === "rent" ? "Сдано" : "Продано"} current={form.status} onChange={handleChange} />
                                <Choice name="status" value="archived" label="В архиве" current={form.status} onChange={handleChange} />
                            </div>
                        </div>
                    )}
                </fieldset>

                <fieldset className={styles.section}>
                    <legend>Цена и площадь</legend>

                    <div className={styles.row}>
                        <div className="field">
                            <label htmlFor="price">
                                {form.deal_type === "rent" ? "Цена в месяц, ₸" : "Цена, ₸"}
                            </label>
                            <input id="price" name="price" className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.price} onChange={handleChange} placeholder="15000000" required />
                        </div>

                        <div className="field">
                            <label htmlFor="area">Площадь, м²</label>
                            <input id="area" name="area" className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.area} onChange={handleChange} placeholder="65" required />
                        </div>
                    </div>

                    <div className={styles.row3}>
                        <div className="field">
                            <label htmlFor="rooms">Комнат</label>
                            <input id="rooms" name="rooms" className="input num" type="number" min="1" value={form.rooms} onChange={handleChange} placeholder={isApartment ? "2" : "—"} />
                        </div>

                        <div className="field">
                            <label htmlFor="floor">Этаж</label>
                            <input id="floor" name="floor" className="input num" type="number" min="1" value={form.floor} onChange={handleChange} placeholder="3" />
                        </div>

                        <div className="field">
                            <label htmlFor="total_floors">Этажей в доме</label>
                            <input id="total_floors" name="total_floors" className="input num" type="number" min="1" value={form.total_floors} onChange={handleChange} placeholder="9" />
                        </div>
                    </div>
                </fieldset>

                <fieldset className={styles.section}>
                    <legend>Где находится</legend>

                    <div className={styles.row}>
                        <div className="field">
                            <label htmlFor="city">Город</label>
                            <input id="city" name="city" className="input" value={form.city} onChange={handleChange} placeholder="Караганда" required />
                        </div>

                        <div className="field">
                            <label htmlFor="address">Адрес</label>
                            <input id="address" name="address" className="input" value={form.address} onChange={handleChange} placeholder="ул. Ерубаева, 35" maxLength={255} required />
                        </div>
                    </div>
                </fieldset>

                <fieldset className={styles.section}>
                    <legend>Фотографии</legend>
                    <p className={styles.hint}>
                        До {MAX_PHOTOS} штук, каждое до 5 МБ. Первое фото — обложка
                        в каталоге.
                        {isEditMode &&
                            " Порядок и удаление уже загруженных фото сохраняются сразу."}
                    </p>

                    <div className={styles.photos} aria-busy={photoBusy}>
                        {savedPhotos.map((photo, index) => (
                            <figure key={photo.id} className={styles.preview}>
                                <img src={thumbnailUrl(photo)} alt="" />
                                {index === 0 && <span className={styles.cover}>Обложка</span>}

                                <button
                                    type="button"
                                    className={styles.remove}
                                    onClick={() => removeSavedPhoto(photo)}
                                    disabled={photoBusy}
                                    aria-label={`Удалить фото ${index + 1}`}
                                >
                                    ×
                                </button>

                                <figcaption className={styles.photoTools}>
                                    <button
                                        type="button"
                                        onClick={() => moveSavedPhoto(index, -1)}
                                        disabled={photoBusy || index === 0}
                                        aria-label={`Сдвинуть фото ${index + 1} левее`}
                                    >
                                        ‹
                                    </button>
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => makeCover(index)}
                                            disabled={photoBusy}
                                        >
                                            Обложка
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => moveSavedPhoto(index, 1)}
                                        disabled={photoBusy || index === savedPhotos.length - 1}
                                        aria-label={`Сдвинуть фото ${index + 1} правее`}
                                    >
                                        ›
                                    </button>
                                </figcaption>
                            </figure>
                        ))}

                        {previews.map((url, index) => (
                            <figure key={url} className={styles.preview}>
                                <img src={url} alt="" />
                                {savedPhotos.length === 0 && index === 0 && (
                                    <span className={styles.cover}>Обложка</span>
                                )}
                                <button
                                    type="button"
                                    className={styles.remove}
                                    onClick={() => removePhoto(index)}
                                    aria-label={`Убрать фото ${photos[index].name}`}
                                >
                                    ×
                                </button>
                            </figure>
                        ))}

                        {slotsLeft > 0 && (
                            <label className={styles.upload}>
                                <input type="file" accept="image/*" multiple onChange={handlePhotosChange} />
                                <span aria-hidden="true">+</span>
                                Добавить фото
                            </label>
                        )}
                    </div>
                </fieldset>

                {error && (
                    <div className="form-error" role="alert">
                        {error}
                    </div>
                )}

                <div className={styles.footer}>
                    <Link
                        to={isEditMode ? `/properties/${id}` : "/profile"}
                        className="btn btn-ghost"
                    >
                        Отмена
                    </Link>

                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving
                            ? "Сохраняем…"
                            : isEditMode
                              ? "Сохранить изменения"
                              : "Опубликовать объявление"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
