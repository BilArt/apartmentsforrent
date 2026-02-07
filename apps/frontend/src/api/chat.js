const API_BASE = import.meta.env.VITE_API_URL || "";

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

async function requestJson(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
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

function cleanStr(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}

export const chatApi = {
  getThreads({ listingId } = {}) {
    const qs = new URLSearchParams();
    const lid = cleanStr(listingId);
    if (lid) qs.set("listingId", lid);

    const q = qs.toString();
    return requestJson(`/chat/threads${q ? `?${q}` : ""}`);
  },

  createThread({ listingId, tenantId } = {}) {
    const lid = cleanStr(listingId);
    if (!lid) throw new Error("listingId is required");

    const tid = cleanStr(tenantId);

    return requestJson("/chat/threads", {
      method: "POST",
      body: JSON.stringify({
        listingId: lid,
        ...(tid ? { tenantId: tid } : {}),
      }),
    });
  },

  getMessages(threadId) {
    const tid = cleanStr(threadId);
    if (!tid) throw new Error("threadId is required");

    return requestJson(`/chat/threads/${encodeURIComponent(tid)}/messages`);
  },

  sendMessage(threadId, { text } = {}) {
    const tid = cleanStr(threadId);
    if (!tid) throw new Error("threadId is required");

    const message = cleanStr(text);
    if (!message) throw new Error("Message text is empty");

    return requestJson(`/chat/threads/${encodeURIComponent(tid)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text: message }),
    });
  },
};
