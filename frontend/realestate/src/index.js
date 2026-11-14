import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
// Global styles go before components so CSS modules win on equal specificity.
import "./styles/index.css";

import App from "./components/App/App";
import { store } from "./features/store";

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
