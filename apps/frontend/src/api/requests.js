const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await parseJson(res);

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }

  return data;
}

export const requestsApi = {
  create(listingId, payload) {
    return requestJson(`/listings/${listingId}/requests`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMy() {
    return requestJson("/requests/my");
  },

  getIncoming() {
    return requestJson("/requests/incoming");
  },

  updateStatus(requestId, status) {
    return requestJson(`/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
