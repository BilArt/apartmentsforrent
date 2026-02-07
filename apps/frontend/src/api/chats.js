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

export const chatsApi = {
  list({ listingId } = {}) {
    const qs = new URLSearchParams();
    if (listingId != null && String(listingId).trim() !== "") {
      qs.set("listingId", String(listingId).trim());
    }
    const q = qs.toString();
    return requestJson(`/chat/threads${q ? `?${q}` : ""}`);
  },

  getMessages(threadId) {
    if (!threadId) throw new Error("threadId is required");
    return requestJson(
      `/chat/threads/${encodeURIComponent(String(threadId))}/messages`,
    );
  },

  sendMessage(threadId, text) {
    if (!threadId) throw new Error("threadId is required");
    const message = String(text ?? "").trim();
    if (!message) throw new Error("Message text is empty");

    return requestJson(
      `/chat/threads/${encodeURIComponent(String(threadId))}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text: message }),
      },
    );
  },

  markRead() {
    return Promise.resolve({ ok: true });
  },

  unreadTotal() {
    return Promise.resolve({ total: 0 });
  },

  openByRequest() {
    return Promise.reject(
      new Error("openByRequest: endpoint not implemented on backend"),
    );
  },
};
