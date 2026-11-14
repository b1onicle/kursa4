import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// react-router v7 relies on TextEncoder, which jsdom does not provide.
// jsdom does not implement scrolling.
window.scrollTo = () => {};

if (!global.TextEncoder) {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}
