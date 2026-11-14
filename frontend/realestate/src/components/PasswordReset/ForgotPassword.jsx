import React, { useState } from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/Auth.module.css";
import { useRequestPasswordResetMutation } from "../../features/api/apiSlice";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const ForgotPassword = () => {
    useDocumentTitle("Восстановление пароля");

    const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        try {
            await requestReset(email).unwrap();
            setSent(true);
        } catch (err) {
            if (err?.status === "FETCH_ERROR") {
                setError("Сервер не отвечает. Проверьте, что бэкенд запущен.");
            } else if (err?.status >= 500) {
                setError("Письмо не отправилось из-за ошибки сервера. Попробуйте позже.");
            } else {
                setError("Проверьте адрес почты.");
            }
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Восстановление пароля</h1>

                {sent ? (
                    <div className={styles.form} role="status">
                        <p>
                            Если <strong>{email}</strong> зарегистрирован,
                            мы отправили на него ссылку для смены пароля.
                            Ссылка действует 3 дня.
                        </p>
                        <p className={styles.note}>
                            В режиме разработки письмо не уходит на почту,
                            а печатается в консоли Django.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className={styles.subtitle}>
                            Укажите почту из профиля, и мы пришлём ссылку
                            для нового пароля.
                        </p>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className="field">
                                <label htmlFor="forgot-email">Email</label>
                                <input
                                    id="forgot-email"
                                    className="input"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="form-error" role="alert">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary ${styles.submit}`}
                                disabled={isLoading}
                            >
                                {isLoading ? "Отправляем…" : "Отправить ссылку"}
                            </button>
                        </form>
                    </>
                )}

                <p className={styles.switch}>
                    Вспомнили пароль? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
