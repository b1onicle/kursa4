import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useRegisterUserMutation } from "../../features/api/apiSlice";
import { ROUTES } from "../../utils/routes";

import styles from "../../styles/Auth.module.css";
import { setAuth } from "../../utils/auth";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

// Server field names shown to people in error messages.
const FIELD_LABELS = {
    username: "Логин",
    email: "Email",
    password: "Пароль",
    first_name: "Имя",
    last_name: "Фамилия",
    phone: "Телефон",
};

const Register = () => {
    const navigate = useNavigate();
    useDocumentTitle("Регистрация");

    const [registerUser, { isLoading }] = useRegisterUserMutation();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
    });

    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const auth = await registerUser(form).unwrap();
            setAuth(auth);
            navigate(ROUTES.PROFILE);
        } catch (error) {
            console.error(error);

            if (error?.data && typeof error.data === "object") {
                setErrorMessage(
                    Object.entries(error.data)
                        .map(([field, value]) => {
                            const text = Array.isArray(value) ? value.join(" ") : String(value);
                            return `${FIELD_LABELS[field] || field}: ${text}`;
                        })
                        .join("\n")
                );
            } else {
                setErrorMessage("Сервер не отвечает. Проверьте, что бэкенд запущен.");
            }
        }
    };

    const input = (name, label, props = {}) => (
        <div className="field">
            <label htmlFor={`register-${name}`}>
                {label}
                {!props.required && <span className={styles.optional}> (необязательно)</span>}
            </label>
            <input
                id={`register-${name}`}
                className="input"
                name={name}
                value={form[name]}
                onChange={handleChange}
                {...props}
            />
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Регистрация</h1>
                <p className={styles.subtitle}>
                    Аккаунт нужен, чтобы сохранять избранное и размещать
                    свои объявления.
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {input("username", "Логин", { required: true, autoComplete: "username" })}
                    {input("email", "Email", { required: true, type: "email", autoComplete: "email" })}
                    {input("password", "Пароль", {
                        required: true,
                        type: "password",
                        minLength: 6,
                        autoComplete: "new-password",
                    })}

                    <div className={styles.row}>
                        {input("first_name", "Имя", { autoComplete: "given-name" })}
                        {input("last_name", "Фамилия", { autoComplete: "family-name" })}
                    </div>

                    {input("phone", "Телефон", { type: "tel", autoComplete: "tel" })}

                    {errorMessage && (
                        <div className="form-error" role="alert">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`btn btn-primary ${styles.submit}`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Создаём аккаунт…" : "Создать аккаунт"}
                    </button>
                </form>

                <p className={styles.switch}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
