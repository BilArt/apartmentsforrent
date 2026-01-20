import { API_BASE_URL } from "./config";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data;
}

export const listingsApi = {
  getAll(cityId) {
    const qs = cityId ? `?cityId=${encodeURIComponent(String(cityId))}` : "";
    return request(`/listings${qs}`, { method: "GET" });
  },

  getById(id) {
    return request(`/listings/${encodeURIComponent(String(id))}`, {
      method: "GET",
    });
  },

  getMy() {
    return request("/listings/my", { method: "GET" });
  },

  create(payload) {
    return request("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
