import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./UserMenu.module.scss";

import ProfileIcon from "../../assets/svg/profile.svg?react";
import ArrowIcon from "../../assets/svg/arrows.svg?react";

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const fullName = useMemo(() => {
    const first = user?.firstName || "";
    const last = user?.lastName || "";
    const name = `${first} ${last}`.trim();
    return name || "Профіль";
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
      >
        <span className={styles.triggerIcon}>
          <ProfileIcon />
        </span>
        <span className={styles.triggerText}>{fullName}</span>
        <span className={open ? styles.chevronOpen : styles.chevron}>
          <ArrowIcon />
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <Link
            to="/profile"
            className={styles.item}
            role="menuitem"
            onClick={close}
          >
            Мій профіль
          </Link>

          <Link
            to="/requests"
            className={styles.item}
            role="menuitem"
            onClick={close}
          >
            Заявки
          </Link>

          <button
            type="button"
            className={`${styles.item} ${styles.itemDisabled}`}
            role="menuitem"
            onClick={() => {}}
            disabled
            title="Скоро"
          >
            Повідомлення <span className={styles.soon}>(скоро)</span>
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={`${styles.item} ${styles.itemDanger}`}
            role="menuitem"
            onClick={() => {
              close();
              onLogout?.();
            }}
          >
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}
