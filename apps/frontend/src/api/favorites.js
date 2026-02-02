const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const favoritesApi = {
  getMy() {
    return request("/favorites");
  },
  toggle(listingId) {
    return request(`/favorites/${listingId}`, { method: "POST" });
  },
};
