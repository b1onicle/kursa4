import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useLoginUserMutation } from "../../features/api/apiSlice";
import { ROUTES } from "../../utils/routes";

import styles from "../../styles/Auth.module.css";
import { setAuth } from "../../utils/auth";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const Login = () => {
    const navigate = useNavigate();
    useDocumentTitle("Вход");

    const [loginUser, { isLoading }] = useLoginUserMutation();

    const [form, setForm] = useState({ username: "", password: "" });
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const auth = await loginUser(form).unwrap();
            setAuth(auth);
            navigate(ROUTES.HOME);
        } catch (error) {
            setErrorMessage(
                error?.status === "FETCH_ERROR"
                    ? "Сервер не отвечает. Проверьте, что бэкенд запущен."
                    : "Неверный логин или пароль."
            );
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Вход</h1>
                <p className={styles.subtitle}>
                    Чтобы сохранять избранное и размещать объявления.
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="login-username">Логин</label>
                        <input
                            id="login-username"
                            className="input"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="login-password">Пароль</label>
                        <input
                            id="login-password"
                            className="input"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Link to="/forgot-password" className={styles.forgot}>
                        Забыли пароль?
                    </Link>

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
                        {isLoading ? "Входим…" : "Войти"}
                    </button>
                </form>

                <p className={styles.switch}>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
