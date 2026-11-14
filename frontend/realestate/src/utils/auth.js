import { useEffect, useState } from "react";

export const getCurrentUser = () => {
    const user = localStorage.getItem("currentUser");

    return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
    localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
    );

    window.dispatchEvent(new Event("authChange"));
};

export const logoutUser = () => {
    localStorage.removeItem("currentUser");

    window.dispatchEvent(new Event("authChange"));
};

export const useCurrentUser = () => {
    const [user, setUser] = useState(getCurrentUser);

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(getCurrentUser());
        };

        window.addEventListener(
            "authChange",
            handleAuthChange
        );

        return () => {
            window.removeEventListener(
                "authChange",
                handleAuthChange
            );
        };
    }, []);

    return user;
};