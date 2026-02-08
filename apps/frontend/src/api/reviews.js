import { API_BASE_URL } from "./config";

async function http(path, opts = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const reviewsApi = {
  getForUser(userId) {
    return http(`/users/${encodeURIComponent(userId)}/reviews`);
  },

  createForContract(contractId, payload) {
    return http(`/contracts/${encodeURIComponent(contractId)}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMy() {
    return http(`/reviews/my`);
  },
};
