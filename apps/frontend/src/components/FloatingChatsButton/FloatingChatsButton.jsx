import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./FloatingChatsButton.module.scss";
import { chatsApi } from "../../api/chats";

import ChatIcon from "../../assets/svg/chat.svg?react";

function toInt(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export default function FloatingChatsButton({ isAuthed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthed) return;

    let alive = true;
    let t = null;

    const tick = async () => {
      try {
        const data = await chatsApi.unreadTotal?.();
        if (!alive) return;
        setUnread(toInt(data?.total, 0));
      } catch {
        if (!alive) return;
        setUnread(0);
      }
    };

    tick();
    t = setInterval(tick, 15000);

    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [isAuthed]);

  if (!isAuthed) return null;

  const onClick = () => {
    navigate("/chats", { state: { from: location } });
  };

  return (
    <button
      type="button"
      className={styles.fab}
      onClick={onClick}
      aria-label="Chats"
      title="Чати"
    >
      <ChatIcon className={styles.icon} />
      {unread > 0 ? (
        <span className={styles.badge}>{unread > 99 ? "99+" : unread}</span>
      ) : null}
    </button>
  );
}
