import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
    beforeEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.theme;
    });

    it("follows the system theme by default", () => {
        render(<ThemeToggle />);

        expect(screen.getByRole("button")).toHaveAttribute("title", "Тема как в системе");
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it("cycles system → light → dark → system and remembers the choice", () => {
        render(<ThemeToggle />);
        const button = screen.getByRole("button");

        fireEvent.click(button);
        expect(document.documentElement.dataset.theme).toBe("light");
        expect(localStorage.getItem("theme")).toBe("light");

        fireEvent.click(button);
        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(localStorage.getItem("theme")).toBe("dark");

        fireEvent.click(button);
        expect(document.documentElement.dataset.theme).toBeUndefined();
        expect(localStorage.getItem("theme")).toBeNull();
    });

    it("restores the saved theme", () => {
        localStorage.setItem("theme", "dark");

        render(<ThemeToggle />);

        expect(document.documentElement.dataset.theme).toBe("dark");
        expect(screen.getByRole("button")).toHaveAttribute("title", "Тёмная тема");
    });
});
