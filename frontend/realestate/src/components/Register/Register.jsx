import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useRegisterUserMutation } from "../../features/api/apiSlice";
import { ROUTES } from "../../utils/routes";

import styles from "../../styles/Register.module.css";
import { setCurrentUser } from "../../utils/auth";

const Register = () => {
    const navigate = useNavigate();

    const [registerUser, { isLoading }] =
        useRegisterUserMutation();

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

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const user = await registerUser(form).unwrap();

            setCurrentUser(user);

navigate(ROUTES.PROFILE);
        } catch (error) {
            console.error(error);

            if (error?.data) {
                setErrorMessage(
                    "Проверьте введённые данные."
                );
            } else {
                setErrorMessage(
                    "Не удалось зарегистрироваться."
                );
            }
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Создание аккаунта</h1>

                <p className={styles.subtitle}>
                    Зарегистрируйтесь, чтобы сохранять объявления
                    и управлять своей недвижимостью.
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
                        Email
                        <input
                            type="email"
                            name="email"
                            value={form.email}
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
                            minLength={6}
                        />
                    </label>

                    <div className={styles.row}>
                        <label>
                            Имя
                            <input
                                type="text"
                                name="first_name"
                                value={form.first_name}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            Фамилия
                            <input
                                type="text"
                                name="last_name"
                                value={form.last_name}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    <label>
                        Телефон
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
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
                            ? "Регистрация..."
                            : "Зарегистрироваться"}
                    </button>
                </form>

                <p className={styles.login}>
                    Уже есть аккаунт?{" "}
                    <Link to={ROUTES.PROFILE}>
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;