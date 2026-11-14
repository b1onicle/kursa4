import { useEffect, useState } from "react";

const TOKEN_KEY = "authToken";
const USER_KEY = "currentUser";

const read = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const notify = () => window.dispatchEvent(new Event("authChange"));

export const getToken = () => read(TOKEN_KEY);

// A user counts as signed in only together with a token; an old
// "currentUser" entry from before token auth is ignored.
export const getCurrentUser = () => {
    const user = read(USER_KEY);
    return user && getToken() ? JSON.parse(user) : null;
};

export const setAuth = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    notify();
};

// Updates the stored profile after editing it; the token stays.
export const setCurrentUser = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    notify();
};

export const logoutUser = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notify();
};

export const useCurrentUser = () => {
    const [user, setUser] = useState(getCurrentUser);

    useEffect(() => {
        const handleAuthChange = () => setUser(getCurrentUser());

        window.addEventListener("authChange", handleAuthChange);
        // Sign-in or sign-out in another tab.
        window.addEventListener("storage", handleAuthChange);

        return () => {
            window.removeEventListener("authChange", handleAuthChange);
            window.removeEventListener("storage", handleAuthChange);
        };
    }, []);

    return user;
};
