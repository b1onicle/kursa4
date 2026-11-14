import React from "react";
import { render, screen } from "@testing-library/react";

import FloorGauge from "./FloorGauge";

const ticks = (container) =>
    [...container.querySelector('[aria-hidden="true"]').children];

const litIndexFromBottom = (container) => {
    const all = ticks(container);
    const lit = all.findIndex((tick) => tick.className);
    return all.length - lit;
};

describe("FloorGauge", () => {
    it("draws one tick per floor for low buildings", () => {
        const { container } = render(<FloorGauge floor={3} total={9} />);

        expect(ticks(container)).toHaveLength(9);
        expect(litIndexFromBottom(container)).toBe(3);
        expect(screen.getByText("3 из 9 эт.")).toBeInTheDocument();
    });

    it("scales tall buildings down so ticks fit the small gauge", () => {
        const { container } = render(<FloorGauge floor={25} total={25} />);

        expect(ticks(container)).toHaveLength(10);
        expect(litIndexFromBottom(container)).toBe(10);
    });

    it("keeps the first floor at the bottom of a tall building", () => {
        const { container } = render(<FloorGauge floor={1} total={30} />);

        expect(litIndexFromBottom(container)).toBe(1);
    });

    it("allows more ticks in the large gauge", () => {
        const { container } = render(
            <FloorGauge floor={12} total={25} size="large" />
        );

        expect(ticks(container)).toHaveLength(16);
    });

    it("renders nothing without a floor", () => {
        const { container } = render(<FloorGauge total={2} />);

        expect(container).toBeEmptyDOMElement();
    });
});
