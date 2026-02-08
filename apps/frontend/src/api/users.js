import { API_BASE_URL } from "./config";

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export const usersApi = {
  async getPublicById(userId) {
    const res = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(String(userId))}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      const data = await safeJson(res);
      const msg =
        data?.message ||
        data?.error ||
        `Failed to load user (HTTP ${res.status})`;
      throw new Error(msg);
    }

    return safeJson(res);
  },
};
