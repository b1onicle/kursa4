import { buildPropertyParams } from "./apiSlice";

describe("buildPropertyParams", () => {
    it("drops empty and 'all' values", () => {
        expect(
            buildPropertyParams({
                property_type: "all",
                deal_type: "rent",
                search: "",
                owner: undefined,
                floor: null,
                page: 2,
            })
        ).toEqual({ deal_type: "rent", page: 2 });
    });

    it("returns an empty object without params", () => {
        expect(buildPropertyParams()).toEqual({});
    });
});
