import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PropertyDetail from "./PropertyDetail";
import { useCurrentUser } from "../../utils/auth";

const mockDeleteProperty = jest.fn();

jest.mock("../../utils/auth", () => ({
    useCurrentUser: jest.fn(),
}));

jest.mock("../../features/api/apiSlice", () => ({
    useGetPropertyQuery: () => ({
        data: {
            id: 5,
            owner: 1,
            title: "Дом у озера",
            description: "Тихое место",
            price: "25000000.00",
            property_type: "house",
            deal_type: "sale",
            city: "Караганда",
            address: "ул. Озёрная, 5",
            area: "120.00",
            photos: [],
        },
        isLoading: false,
        isError: false,
    }),
    useGetUserQuery: () => ({ data: { id: 1, username: "owner" } }),
    useGetFavoritesQuery: () => ({ data: [] }),
    useAddFavoriteMutation: () => [jest.fn(), {}],
    useDeleteFavoriteMutation: () => [jest.fn(), {}],
    useDeletePropertyMutation: () => [
        mockDeleteProperty,
        { isLoading: false },
    ],
}));

const renderDetail = () =>
    render(
        <MemoryRouter initialEntries={["/properties/5"]}>
            <Routes>
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/properties" element={<div>Каталог</div>} />
            </Routes>
        </MemoryRouter>
    );

describe("PropertyDetail owner actions", () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("hides edit and delete for other users", () => {
        useCurrentUser.mockReturnValue({ id: 2 });

        renderDetail();

        expect(screen.queryByText("Редактировать")).not.toBeInTheDocument();
        expect(screen.queryByText("Удалить")).not.toBeInTheDocument();
    });

    it("shows an edit link for the owner", () => {
        useCurrentUser.mockReturnValue({ id: 1 });

        renderDetail();

        expect(screen.getByText("Редактировать")).toHaveAttribute(
            "href",
            "/properties/5/edit"
        );
    });

    it("does not delete when the owner cancels", () => {
        useCurrentUser.mockReturnValue({ id: 1 });
        jest.spyOn(window, "confirm").mockReturnValue(false);

        renderDetail();
        fireEvent.click(screen.getByText("Удалить"));

        expect(mockDeleteProperty).not.toHaveBeenCalled();
    });

    it("deletes and returns to the catalog after confirmation", async () => {
        useCurrentUser.mockReturnValue({ id: 1 });
        jest.spyOn(window, "confirm").mockReturnValue(true);
        mockDeleteProperty.mockReturnValue({
            unwrap: () => Promise.resolve(),
        });

        renderDetail();
        fireEvent.click(screen.getByText("Удалить"));

        expect(mockDeleteProperty).toHaveBeenCalledWith(5);
        await waitFor(() =>
            expect(screen.getByText("Каталог")).toBeInTheDocument()
        );
    });
});
