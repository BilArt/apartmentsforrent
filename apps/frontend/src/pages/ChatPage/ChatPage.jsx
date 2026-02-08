import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ChatPage.module.scss";
import { chatApi } from "../../api/chat";

function toStr(v) {
  return String(v ?? "").trim();
}

function extractErrMessage(e) {
  if (!e) return "";
  if (typeof e === "string") return e;
  const msg = e?.message ? String(e.message) : "";
  return msg || "";
}

function isAuthErrorMessage(msg) {
  const s = String(msg || "").toLowerCase();
  return (
    s.includes("not authenticated") ||
    s.includes("unauthorized") ||
    s.includes("forbidden") ||
    s.includes("401") ||
    s.includes("403")
  );
}

function fullName(u) {
  const fn = toStr(u?.firstName);
  const ln = toStr(u?.lastName);
  const s = `${fn} ${ln}`.trim();
  return s || "Користувач";
}

export default function ChatPage({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const listingId = toStr(searchParams.get("listingId"));
  const threadIdFromUrl = toStr(searchParams.get("threadId"));

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [threadId, setThreadId] = useState(threadIdFromUrl || "");
  const [threadMeta, setThreadMeta] = useState(null);

  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const listRef = useRef(null);
  const activeThreadRef = useRef("");
  const pollingRef = useRef(null);
  const inFlightRef = useRef(false);
  const lastHashRef = useRef("");

  const backTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/listings";

  const canWork = useMemo(() => {
    return Boolean(threadIdFromUrl || threadId || listingId);
  }, [threadIdFromUrl, threadId, listingId]);

  useEffect(() => {
    activeThreadRef.current = threadId;
  }, [threadId]);

  const authorNameById = useMemo(() => {
    const map = new Map();

    const meId = toStr(currentUser?.id);
    if (meId) map.set(meId, fullName(currentUser));

    const owner = threadMeta?.owner;
    const tenant = threadMeta?.tenant;

    const ownerId = toStr(threadMeta?.ownerId || owner?.id);
    const tenantId = toStr(threadMeta?.tenantId || tenant?.id);

    if (ownerId) map.set(ownerId, fullName(owner) || "Орендодавець");
    if (tenantId) map.set(tenantId, fullName(tenant) || "Орендар");

    return map;
  }, [currentUser, threadMeta]);

  const getAuthorLabel = (authorId, mine) => {
    if (mine) return "Ви";
    const name = authorNameById.get(toStr(authorId));
    return name || "Співрозмовник";
  };

  const loadThreadMeta = async (tid) => {
    if (!tid) return;

    if (typeof chatApi.getThread === "function") {
      const meta = await chatApi.getThread(tid);
      setThreadMeta(meta || null);
      return;
    }

    if (listingId) {
      const threads = await chatApi.getThreads({ listingId });
      const arr = Array.isArray(threads) ? threads : threads?.items || [];
      const found = arr.find((t) => toStr(t?.id) === toStr(tid));
      setThreadMeta(found || null);
    }
  };

  const loadMessages = async (tid, { silent = false } = {}) => {
    if (!tid) return;

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (!silent) setError("");
      const msgs = await chatApi.getMessages(tid);
      const list = Array.isArray(msgs) ? msgs : msgs?.items || [];
      const arr = Array.isArray(list) ? list : [];

      const last = arr.length ? arr[arr.length - 1] : null;
      const hash = last?.id
        ? String(last.id)
        : `${arr.length}:${last?.createdAt || ""}`;

      if (hash && hash === lastHashRef.current) return;
      lastHashRef.current = hash;

      setMessages(arr);
    } catch (e) {
      const msg = extractErrMessage(e) || "Не вдалося завантажити повідомлення";
      if (!silent) setError(msg);

      if (isAuthErrorMessage(msg)) {
        setStatus("error");
        setError("Сесія закінчилась. Увійдіть знову.");
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!canWork) {
        setStatus("error");
        setError("Немає параметрів чату (listingId/threadId).");
        return;
      }

      try {
        setStatus("loading");
        setError("");

        let tid = threadIdFromUrl || "";

        if (tid) {
          if (!alive) return;
          setThreadId(tid);
          activeThreadRef.current = tid;

          try {
            await loadThreadMeta(tid);
          } catch {
            //
          }

          await loadMessages(tid);
          if (!alive) return;

          setStatus("ok");
          return;
        }

        if (!listingId) {
          setStatus("error");
          setError("Немає listingId або threadId.");
          return;
        }

        const threads = await chatApi.getThreads({ listingId });
        const arr = Array.isArray(threads) ? threads : threads?.items || [];
        const first = Array.isArray(arr) ? arr[0] : null;

        if (first?.id) {
          tid = String(first.id);
          setThreadMeta(first || null);
        } else {
          const created = await chatApi.createThread({ listingId });
          tid = created?.id ? String(created.id) : "";
          setThreadMeta(created || null);
        }

        if (!tid) throw new Error("Не вдалося створити/знайти чат.");

        if (!alive) return;
        setThreadId(tid);
        activeThreadRef.current = tid;

        try {
          await loadThreadMeta(tid);
        } catch {
          //
        }

        await loadMessages(tid);
        if (!alive) return;

        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        const msg = extractErrMessage(e) || "Не вдалося відкрити чат";
        setStatus("error");
        setError(msg);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, threadIdFromUrl]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (status !== "ok") return;
    if (!threadId) return;

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      const tid = activeThreadRef.current;
      if (!tid) return;
      loadMessages(tid, { silent: true });
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, threadId]);

  const refresh = async () => {
    const tid = threadId;
    if (!tid) return;
    await loadMessages(tid);
  };

  const send = async () => {
    const tid = threadId;
    if (!tid) return;

    const msg = toStr(text);
    if (!msg) return;

    setSending(true);
    try {
      setError("");
      const created = await chatApi.sendMessage(tid, { text: msg });

      if (created && typeof created === "object") {
        setMessages((prev) => {
          const next = [...prev, created];
          const last = next[next.length - 1];
          lastHashRef.current = last?.id
            ? String(last.id)
            : lastHashRef.current;
          return next;
        });
      } else {
        await loadMessages(tid);
      }

      setText("");
    } catch (e) {
      const msgErr =
        extractErrMessage(e) || "Не вдалося надіслати повідомлення";
      setError(msgErr);

      if (isAuthErrorMessage(msgErr)) {
        setStatus("error");
        setError("Сесія закінчилась. Увійдіть знову.");
      }
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const titleLeft = threadMeta?.listing?.title
    ? `Оголошення: ${threadMeta.listing.title}`
    : listingId
      ? `Оголошення: ${listingId}`
      : "Чат";

  const titleRight = threadMeta
    ? `Учасники: ${fullName(threadMeta.owner)} • ${fullName(threadMeta.tenant)}`
    : currentUser?.firstName
      ? `Ви: ${currentUser.firstName}`
      : "";

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(backTo)}
          >
            ← Назад
          </button>

          <div className={styles.headRight}>
            <div className={styles.title}>Чат</div>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={refresh}
              disabled={!threadId || status === "loading"}
            >
              Оновити
            </button>
          </div>
        </div>

        {status === "loading" && (
          <div className={styles.state}>Відкриваємо чат…</div>
        )}

        {status === "error" && (
          <div className={`${styles.state} ${styles.stateError}`}>
            <div className={styles.stateTitle}>Помилка</div>
            <div className={styles.stateText}>{error}</div>
          </div>
        )}

        {status === "ok" && (
          <div className={styles.card}>
            <div className={styles.meta}>
              <div className={styles.metaText}>{titleLeft}</div>
              <div className={styles.metaTextMuted}>{titleRight}</div>
            </div>

            <div className={styles.messages} ref={listRef}>
              {messages.length ? (
                messages.map((m, idx) => {
                  const mid = m?.id ? String(m.id) : `${idx}`;
                  const authorId = m?.authorId ? String(m.authorId) : "";
                  const mine =
                    currentUser?.id &&
                    authorId &&
                    String(currentUser.id) === authorId;

                  const textMsg =
                    String(m?.text ?? m?.message ?? "").trim() || "—";

                  const authorLabel = getAuthorLabel(authorId, mine);

                  return (
                    <div
                      key={mid}
                      className={mine ? styles.msgMine : styles.msgOther}
                    >
                      <div className={styles.msgCol}>
                        {!mine && (
                          <div className={styles.authorName}>{authorLabel}</div>
                        )}
                        <div className={styles.bubble}>{textMsg}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.empty}>
                  Поки що немає повідомлень. Напиши першим 🙂
                </div>
              )}
            </div>

            <div className={styles.composer}>
              <textarea
                className={styles.input}
                placeholder="Напиши повідомлення…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
              />

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={send}
                disabled={sending || !toStr(text)}
              >
                Надіслати
              </button>
            </div>

            {error ? <div className={styles.inlineError}>{error}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
