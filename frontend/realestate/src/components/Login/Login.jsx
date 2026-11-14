import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useLoginUserMutation } from "../../features/api/apiSlice";
import { ROUTES } from "../../utils/routes";

import styles from "../../styles/Login.module.css";
import { setCurrentUser } from "../../utils/auth";

const Login = () => {
    const navigate = useNavigate();

    const [loginUser, { isLoading }] =
        useLoginUserMutation();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const user = await loginUser(form).unwrap();

            setCurrentUser(user);

            navigate(ROUTES.PROFILE);
        } catch (error) {
            setErrorMessage(
                error?.data?.detail ||
                "Неверный логин или пароль."
            );
        }
    };
    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Вход</h1>

                <p className={styles.subtitle}>
                    Войдите в свой аккаунт RealEstate
                </p>

                <form onSubmit={handleSubmit}>
                    <label>
                        Логин
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Пароль
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    {errorMessage && (
                        <p className={styles.error}>
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Вход..."
                            : "Войти"}
                    </button>
                </form>

                <p className={styles.register}>
                    Нет аккаунта?{" "}
                    <Link to="/register">
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;