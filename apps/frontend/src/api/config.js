export const API_ORIGIN = import.meta.env.VITE_API_URL || "";

export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

export const MEDIA_ORIGIN = API_ORIGIN || "";
