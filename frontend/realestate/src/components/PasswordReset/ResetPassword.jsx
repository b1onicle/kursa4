import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import styles from "../../styles/Auth.module.css";
import { useConfirmPasswordResetMutation } from "../../features/api/apiSlice";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const ResetPassword = () => {
    useDocumentTitle("Новый пароль");

    const [params] = useSearchParams();
    const uid = params.get("uid");
    const token = params.get("token");

    const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();
    const [password, setPassword] = useState("");
    const [repeat, setRepeat] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (password !== repeat) {
            setError("Пароли не совпадают.");
            return;
        }

        try {
            await confirmReset({ uid, token, password }).unwrap();
            setDone(true);
        } catch (err) {
            setError(
                err?.data?.detail ||
                    err?.data?.password?.join(" ") ||
                    "Не удалось сменить пароль. Запросите новую ссылку."
            );
        }
    };

    if (!uid || !token) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <h1>Ссылка неполная</h1>
                    <p className={styles.subtitle}>
                        Откройте ссылку из письма целиком или запросите новую.
                    </p>
                    <p className={styles.switch}>
                        <Link to="/forgot-password">Запросить ссылку</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Новый пароль</h1>

                {done ? (
                    <div className={styles.form} role="status">
                        <p>Пароль изменён. Теперь войдите с новым паролем.</p>
                        <Link to="/login" className={`btn btn-primary ${styles.submit}`}>
                            Войти
                        </Link>
                    </div>
                ) : (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="reset-password">Новый пароль</label>
                            <input
                                id="reset-password"
                                className="input"
                                type="password"
                                autoComplete="new-password"
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="reset-repeat">Повторите пароль</label>
                            <input
                                id="reset-repeat"
                                className="input"
                                type="password"
                                autoComplete="new-password"
                                minLength={6}
                                value={repeat}
                                onChange={(e) => setRepeat(e.target.value)}
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
                            {isLoading ? "Сохраняем…" : "Сохранить пароль"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
