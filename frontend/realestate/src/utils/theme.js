import { useEffect, useState } from "react";

const KEY = "theme";
export const THEMES = ["system", "light", "dark"];

const readTheme = () => {
    try {
        const value = localStorage.getItem(KEY);
        return THEMES.includes(value) ? value : "system";
    } catch {
        return "system";
    }
};

// "system" removes the attribute and lets prefers-color-scheme decide.
const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === "system") {
        delete root.dataset.theme;
    } else {
        root.dataset.theme = theme;
    }
};

export const useTheme = () => {
    const [theme, setTheme] = useState(readTheme);

    useEffect(() => {
        applyTheme(theme);
        try {
            if (theme === "system") localStorage.removeItem(KEY);
            else localStorage.setItem(KEY, theme);
        } catch {
            // Storage can be unavailable (private mode); the theme still applies.
        }
    }, [theme]);

    const cycleTheme = () =>
        setTheme((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);

    return [theme, cycleTheme];
};
