import React from "react";

import styles from "../../styles/FloorGauge.module.css";

// How many floor ticks physically fit in each gauge height
// (tick >= 1px plus the gap between ticks, see FloorGauge.module.css).
const MAX_TICKS = { small: 10, large: 16 };

// A building drawn as a stack of floors with the listing's floor lit.
const FloorGauge = ({ floor, total, size = "small" }) => {
    if (!floor) return null;

    const floors = Math.max(total || floor, floor);
    const ticks = Math.min(floors, MAX_TICKS[size] ?? MAX_TICKS.small);
    // Tall buildings are scaled down so the gauge keeps its height.
    const litTick = Math.max(1, Math.round((floor / floors) * ticks));

    const label = total ? `${floor} из ${total}` : `${floor}`;

    return (
        <span
            className={`${styles.gauge} ${styles[size]}`}
            title={total ? `${floor} этаж из ${total}` : `${floor} этаж`}
        >
            <span className={styles.stack} aria-hidden="true">
                {Array.from({ length: ticks }, (_, i) => {
                    const level = ticks - i;
                    return (
                        <span
                            key={level}
                            className={level === litTick ? styles.lit : undefined}
                        />
                    );
                })}
            </span>

            <span className="num">
                {label}
                {size === "small" ? " эт." : ""}
            </span>
        </span>
    );
};

export default FloorGauge;
