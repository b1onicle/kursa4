import React, { useMemo } from "react";

import styles from "../../styles/Facade.module.css";

const FLOORS = 12;
const COLUMNS = 6;
const WINDOWS = FLOORS * COLUMNS;

// Deterministic shuffle so the same windows light up on every visit.
const shuffledOrder = () => {
    const order = Array.from({ length: WINDOWS }, (_, i) => i);
    let seed = 7;

    for (let i = order.length - 1; i > 0; i -= 1) {
        seed = (seed * 16807) % 2147483647;
        const j = Math.floor((seed / 2147483647) * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }

    return order;
};

const ORDER = shuffledOrder();

/*
 * A panel block at dusk. One window lights up per listing in the catalogue,
 * one after another, when the count arrives.
 */
const Facade = ({ litCount = 0 }) => {
    const lit = useMemo(() => {
        const map = new Map();
        ORDER.slice(0, Math.min(litCount, WINDOWS)).forEach((windowIndex, step) => {
            map.set(windowIndex, step);
        });
        return map;
    }, [litCount]);

    return (
        <div className={styles.scene} aria-hidden="true">
            <div className={styles.backBlock} />

            <div className={styles.block}>
                <div className={styles.roof} />

                <div
                    className={styles.windows}
                    style={{ "--columns": COLUMNS, "--floors": FLOORS }}
                >
                    {Array.from({ length: WINDOWS }, (_, i) => {
                        const step = lit.get(i);
                        const isLit = step !== undefined;

                        return (
                            <span
                                key={i}
                                className={`${styles.window} ${
                                    isLit ? styles.lit : ""
                                } ${isLit && step % 5 === 2 ? styles.warm : ""}`}
                                style={isLit ? { "--d": `${step * 45}ms` } : undefined}
                            />
                        );
                    })}
                </div>

                <div className={styles.entrance} />
            </div>

            <div className={styles.ground} />
        </div>
    );
};

export default Facade;
