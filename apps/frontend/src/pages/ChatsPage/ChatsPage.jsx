import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./ChatsPage.module.scss";
import { chatsApi } from "../../api/chats";

function toStr(v) {
  return String(v ?? "").trim();
}

function getOtherUserName(thread, currentUser) {
  const meId = toStr(currentUser?.id);
  const owner = thread?.owner;
  const tenant = thread?.tenant;

  const ownerId = toStr(thread?.ownerId || owner?.id);

  const other = meId && ownerId === meId ? tenant : owner;

  const fn = toStr(other?.firstName);
  const ln = toStr(other?.lastName);
  const name = `${fn} ${ln}`.trim();

  return name || "Користувач";
}

function getTitle(thread, currentUser) {
  const listingTitle = toStr(thread?.listing?.title);
  if (listingTitle) return listingTitle;
  return getOtherUserName(thread, currentUser);
}

function getLastMessageText(thread) {
  const m = thread?.lastMessage;
  const text = toStr(m?.text);
  return text ? text.slice(0, 64) : "—";
}

export default function ChatsPage({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const conversationIdFromUrl = toStr(searchParams.get("conversationId"));

  const [list, setList] = useState([]);
  const [listStatus, setListStatus] = useState("loading");
  const [listError, setListError] = useState("");

  const [activeId, setActiveId] = useState(conversationIdFromUrl || "");

  const [messages, setMessages] = useState([]);
  const [msgStatus, setMsgStatus] = useState("idle");
  const [msgError, setMsgError] = useState("");

  const [draft, setDraft] = useState("");

  const pollRef = useRef(null);

  const backTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/listings";

  const refreshList = async () => {
    setListStatus("loading");
    setListError("");
    try {
      const data = await chatsApi.list();
      setList(Array.isArray(data) ? data : []);
      setListStatus("ok");
    } catch (e) {
      setListStatus("error");
      setListError(e?.message || "Не вдалося завантажити чати");
    }
  };

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMessages = async (convId) => {
    if (!convId) return;

    setMsgStatus("loading");
    setMsgError("");

    try {
      const data = await chatsApi.getMessages(convId);
      setMessages(Array.isArray(data) ? data : []);
      setMsgStatus("ok");

      chatsApi.markRead(convId).catch(() => {});
    } catch (e) {
      setMsgStatus("error");
      setMsgError(e?.message || "Не вдалося завантажити повідомлення");
    }
  };

  useEffect(() => {
    setActiveId(conversationIdFromUrl || "");
  }, [conversationIdFromUrl]);

  useEffect(() => {
    if (!activeId) return;

    loadMessages(activeId);

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const data = await chatsApi.getMessages(activeId);
        setMessages(Array.isArray(data) ? data : []);
        chatsApi.markRead(activeId).catch(() => {});
      } catch {
        // тихо
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [activeId]);

  const activeConversation = useMemo(
    () => list.find((c) => toStr(c?.id) === toStr(activeId)) || null,
    [list, activeId],
  );

  const openConversation = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("conversationId", String(id));
    setSearchParams(next);
  };

  const onSend = async () => {
    const text = String(draft || "").trim();
    if (!text || !activeId) return;

    setDraft("");

    try {
      await chatsApi.sendMessage(activeId, text);

      const data = await chatsApi.getMessages(activeId);
      setMessages(Array.isArray(data) ? data : []);
      chatsApi.markRead(activeId).catch(() => {});
      refreshList();
    } catch (e) {
      setMsgError(e?.message || "Не вдалося надіслати повідомлення");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(backTo)}
        >
          ← Назад
        </button>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>Чати</div>

            {listStatus === "loading" ? (
              <div className={styles.state}>Завантаження…</div>
            ) : listStatus === "error" ? (
              <div className={`${styles.state} ${styles.stateError}`}>
                {listError || "Помилка"}
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={refreshList}
                >
                  Оновити
                </button>
              </div>
            ) : !list.length ? (
              <div className={styles.state}>Поки що чатів немає.</div>
            ) : (
              <div className={styles.chatList}>
                {list.map((c) => {
                  const id = toStr(c?.id);
                  const active = id === toStr(activeId);

                  const unread = 0;

                  return (
                    <button
                      key={id}
                      type="button"
                      className={
                        active ? styles.chatItemActive : styles.chatItem
                      }
                      onClick={() => openConversation(id)}
                    >
                      <div className={styles.chatTitleRow}>
                        <div className={styles.chatTitle}>
                          {getTitle(c, currentUser)}
                        </div>
                        {unread > 0 ? (
                          <span className={styles.unreadBadge}>
                            {unread > 99 ? "99+" : unread}
                          </span>
                        ) : null}
                      </div>
                      <div className={styles.chatSub}>
                        {getLastMessageText(c)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className={styles.main}>
            {!activeId ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>Обери чат</div>
                <div className={styles.emptyText}>
                  Відкрий чат зі списку зліва.
                </div>
              </div>
            ) : (
              <div className={styles.chatShell}>
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderTitle}>
                    {activeConversation
                      ? getTitle(activeConversation, currentUser)
                      : "Чат"}
                  </div>
                </div>

                <div className={styles.messages}>
                  {msgStatus === "loading" ? (
                    <div className={styles.state}>Завантаження…</div>
                  ) : msgStatus === "error" ? (
                    <div className={`${styles.state} ${styles.stateError}`}>
                      {msgError || "Помилка"}
                    </div>
                  ) : !messages.length ? (
                    <div className={styles.state}>Повідомлень ще немає.</div>
                  ) : (
                    messages.map((m) => {
                      const mine =
                        toStr(m?.authorId) === toStr(currentUser?.id);
                      return (
                        <div
                          key={m?.id || `${m?.createdAt}-${m?.text}`}
                          className={mine ? styles.msgMine : styles.msg}
                        >
                          <div className={styles.msgBubble}>
                            {m?.text || "—"}
                          </div>
                          <div className={styles.msgMeta}>
                            {m?.createdAt
                              ? String(m.createdAt)
                                  .slice(0, 19)
                                  .replace("T", " ")
                              : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {msgError ? (
                  <div className={styles.inlineError}>{msgError}</div>
                ) : null}

                <div className={styles.composer}>
                  <input
                    className={styles.input}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Напиши повідомлення…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.sendBtn}
                    onClick={onSend}
                    disabled={!draft.trim()}
                  >
                    Надіслати
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
