import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PropertyCatalog from "./PropertyCatalog";
import { useGetPropertiesQuery } from "../../features/api/apiSlice";

jest.mock("../../features/api/apiSlice", () => ({
    useGetPropertiesQuery: jest.fn(),
    useGetFavoritesQuery: () => ({ data: [] }),
    useAddFavoriteMutation: () => [jest.fn(), {}],
    useDeleteFavoriteMutation: () => [jest.fn(), {}],
}));

const makeProperty = (id) => ({
    id,
    title: `Объект ${id}`,
    price: "1000000.00",
    property_type: "apartment",
    deal_type: "sale",
    city: "Караганда",
    address: "ул. Ленина, 1",
    area: "50.00",
    status: "active",
    photos: [],
});

const lastQueryArgs = () => useGetPropertiesQuery.mock.calls.at(-1)[0];

const renderCatalog = (url = "/properties") =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <PropertyCatalog />
        </MemoryRouter>
    );

describe("PropertyCatalog", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        useGetPropertiesQuery.mockReturnValue({
            data: {
                count: 30,
                results: [makeProperty(1), makeProperty(2)],
            },
            isLoading: false,
            isFetching: false,
            isError: false,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it("requests the first page with default filters", () => {
        renderCatalog();

        expect(lastQueryArgs()).toEqual({
            property_type: "all",
            deal_type: "all",
            search: "",
            ordering: "newest",
            rooms: "",
            price_min: "",
            price_max: "",
            area_min: "",
            area_max: "",
            page: 1,
            page_size: 12,
        });
    });

    it("reads filters from the URL", () => {
        renderCatalog("/properties?deal_type=rent&search=Караганда&page=2");

        expect(lastQueryArgs()).toMatchObject({
            deal_type: "rent",
            search: "Караганда",
            page: 2,
        });
        expect(screen.getByRole("radio", { name: "Аренда" })).toBeChecked();
        expect(screen.getByPlaceholderText("Город или адрес")).toHaveValue("Караганда");
    });

    it("shows the total count from the server and pagination", () => {
        renderCatalog();

        expect(screen.getByText("30 объявлений")).toBeInTheDocument();
        expect(screen.getByText("Объект 1")).toBeInTheDocument();
        expect(screen.getByText("Страница 1 из 3")).toBeInTheDocument();
    });

    it("sends filters to the server and resets the page", () => {
        renderCatalog();

        fireEvent.click(screen.getByRole("button", { name: /Вперёд/ }));
        expect(lastQueryArgs().page).toBe(2);

        fireEvent.click(screen.getByRole("radio", { name: "Аренда" }));

        expect(lastQueryArgs()).toMatchObject({
            deal_type: "rent",
            page: 1,
        });
    });

    it("debounces the location search", () => {
        renderCatalog();

        fireEvent.change(screen.getByPlaceholderText("Город или адрес"), {
            target: { value: "  Караганда " },
        });

        expect(lastQueryArgs().search).toBe("");

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(lastQueryArgs().search).toBe("Караганда");
    });

    it("filters by rooms with the 4+ option", () => {
        renderCatalog();

        fireEvent.click(screen.getByRole("button", { name: /Ещё фильтры/ }));
        fireEvent.click(screen.getByRole("checkbox", { name: "1" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "4+" }));

        expect(lastQueryArgs().rooms).toBe("1,4");
    });

    it("sends a price range after typing stops", () => {
        renderCatalog();

        fireEvent.click(screen.getByRole("button", { name: /Ещё фильтры/ }));
        fireEvent.change(screen.getByLabelText("Цена от"), {
            target: { value: "5000000" },
        });

        expect(lastQueryArgs().price_min).toBe("");

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(lastQueryArgs().price_min).toBe("5000000");
    });

    it("opens extra filters when the URL already has them", () => {
        renderCatalog("/properties?rooms=2&area_min=40");

        expect(screen.getByRole("checkbox", { name: "2" })).toBeChecked();
        expect(screen.getByLabelText("Площадь от")).toHaveValue(40);
        expect(screen.getByRole("button", { name: /Ещё фильтры/ })).toHaveTextContent("2");
    });
});
