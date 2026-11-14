import { getCurrentUser, getToken, logoutUser, setAuth, setCurrentUser } from "./auth";

describe("auth storage", () => {
    beforeEach(() => localStorage.clear());

    it("is signed out by default", () => {
        expect(getCurrentUser()).toBeNull();
        expect(getToken()).toBeNull();
    });

    it("keeps the token and the user after sign-in", () => {
        setAuth({ token: "abc", user: { id: 1, username: "ivan" } });

        expect(getToken()).toBe("abc");
        expect(getCurrentUser()).toEqual({ id: 1, username: "ivan" });
    });

    it("ignores a stored user without a token", () => {
        // What older versions of the app left in localStorage.
        localStorage.setItem("currentUser", JSON.stringify({ id: 1 }));

        expect(getCurrentUser()).toBeNull();
    });

    it("updates the profile without touching the token", () => {
        setAuth({ token: "abc", user: { id: 1, first_name: "" } });
        setCurrentUser({ id: 1, first_name: "Иван" });

        expect(getToken()).toBe("abc");
        expect(getCurrentUser().first_name).toBe("Иван");
    });

    it("forgets everything on logout and notifies listeners", () => {
        const listener = jest.fn();
        window.addEventListener("authChange", listener);
        setAuth({ token: "abc", user: { id: 1 } });

        logoutUser();

        expect(getToken()).toBeNull();
        expect(getCurrentUser()).toBeNull();
        expect(listener).toHaveBeenCalledTimes(2);
        window.removeEventListener("authChange", listener);
    });
});
