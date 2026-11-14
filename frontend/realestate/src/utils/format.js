// Backend address; override with REACT_APP_API_URL in .env (see .env.example).
export const API_ORIGIN = (
    process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const mediaUrl = (path) => {
    if (!path) return null;
    return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
};

// Small copy for cards; falls back to the original for old photos.
export const thumbnailUrl = (photo) =>
    mediaUrl(photo?.thumbnail || photo?.image);

export const formatPrice = (value) =>
    `${Number(value).toLocaleString("ru-RU", {
        maximumFractionDigits: 0,
    })} ₸`;

// "50.00" -> "50", "65.50" -> "65,5"
export const formatArea = (value) =>
    Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 1 });

export const PROPERTY_TYPES = {
    apartment: "Квартира",
    house: "Дом",
    commercial: "Помещение",
};

export const DEAL_TYPES = {
    sale: "Продажа",
    rent: "Аренда",
};

export const STATUS_LABELS = {
    active: "Активно",
    sold: "Продано",
    archived: "В архиве",
};

// Natural phrase for a listing: "Квартира на продажу", "Дом в аренду".
export const listingKind = (property) => {
    const kind = PROPERTY_TYPES[property.property_type] || "Объект";
    const deal = property.deal_type === "rent" ? "в аренду" : "на продажу";

    return `${kind} ${deal}`;
};

const plural = (n, one, few, many) => {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
};

export const pluralize = (n, one, few, many) =>
    `${n.toLocaleString("ru-RU")} ${plural(n, one, few, many)}`;

export const listingsCount = (n) =>
    pluralize(n, "объявление", "объявления", "объявлений");
