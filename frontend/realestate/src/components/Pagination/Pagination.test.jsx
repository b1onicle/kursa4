import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import Pagination from "./Pagination";

describe("Pagination", () => {
    it("renders nothing for a single page", () => {
        const { container } = render(
            <Pagination page={1} totalPages={1} onPageChange={() => {}} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("disables 'back' on the first page and moves forward", () => {
        const onPageChange = jest.fn();

        render(
            <Pagination page={1} totalPages={3} onPageChange={onPageChange} />
        );

        expect(screen.getByText("Страница 1 из 3")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Назад/ })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: /Вперёд/ }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("disables 'forward' on the last page", () => {
        render(
            <Pagination page={3} totalPages={3} onPageChange={() => {}} />
        );

        expect(screen.getByRole("button", { name: /Вперёд/ })).toBeDisabled();
    });
});
