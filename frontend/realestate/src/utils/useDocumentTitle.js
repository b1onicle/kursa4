import { useEffect } from "react";

const SITE = "RealEstate";

// Sets the browser tab title: "Каталог — RealEstate".
export const useDocumentTitle = (title) => {
    useEffect(() => {
        document.title = title ? `${title} — ${SITE}` : SITE;
    }, [title]);
};
