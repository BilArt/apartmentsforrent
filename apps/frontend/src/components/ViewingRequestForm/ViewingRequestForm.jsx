import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ViewingRequestForm.module.scss";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";

import CalendarIcon from "../../assets/svg/calendar.svg?react";
import ClearIcon from "../../assets/svg/clear.svg?react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatUaDate(d) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ViewingRequestForm({ listingId, onSubmitted }) {
  const [openId, setOpenId] = useState(null);
  const dropdownRefs = useRef(new Map());

  const registerDropdownRef = (id) => (node) => {
    if (!id) return;
    if (node) dropdownRefs.current.set(id, node);
    else dropdownRefs.current.delete(id);
  };

  useEffect(() => {
    const onDown = (e) => {
      if (!openId) return;

      const node = dropdownRefs.current.get(openId);
      if (!node) {
        setOpenId(null);
        return;
      }

      if (!node.contains(e.target)) setOpenId(null);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const today = useMemo(() => startOfDay(new Date()), []);
  const [whenDate, setWhenDate] = useState(null); // Date | null

  const whenLabel = useMemo(() => {
    if (!whenDate) return "Обрати дату";
    if (sameDay(whenDate, today)) return "Від сьогодні";
    return formatUaDate(whenDate);
  }, [whenDate, today]);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && contact.trim().length >= 3;
  }, [name, contact]);

  const clearDate = () => setWhenDate(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      listingId,
      name: name.trim(),
      contact: contact.trim(),
      preferredDate: whenDate ? formatISODate(whenDate) : null,
      message: message.trim() || null,
    };

    // MVP: пока просто лог, позже заменим на POST
    console.log("VIEWING REQUEST:", payload);

    onSubmitted?.();
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.metaLine}>
        Оголошення: <span className={styles.metaValue}>{listingId || "—"}</span>
      </div>

      <div className={styles.grid}>
        {/* Имя */}
        <div className={styles.field}>
          <label className={styles.label}>Ім’я</label>

          <div className={styles.control}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Напр. Артем"
              autoComplete="name"
            />

            {name && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setName("")}
                aria-label="Clear name"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Контакт */}
        <div className={styles.field}>
          <label className={styles.label}>Контакт (телефон / Telegram)</label>

          <div className={styles.control}>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+45… або @username"
              autoComplete="tel"
            />

            {contact && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setContact("")}
                aria-label="Clear contact"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Дата — наш CalendarDropdown */}
        <div className={styles.field}>
          <label className={styles.label}>Бажана дата</label>

          <div className={styles.selectBox} ref={registerDropdownRef("when")}>
            <button
              type="button"
              className={styles.selectBtn}
              onClick={() => toggle("when")}
              aria-expanded={openId === "when"}
            >
              <span
                className={`${styles.selectValue} ${
                  whenDate ? styles.selectValueActive : ""
                }`}
              >
                {whenLabel}
              </span>

              {/* кнопка очистки даты */}
              {whenDate && (
                <span className={styles.selectClearWrap}>
                  <button
                    type="button"
                    className={styles.selectClearBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearDate();
                    }}
                    aria-label="Clear date"
                  >
                    <ClearIcon />
                  </button>
                </span>
              )}

              <span className={styles.selectIcon} aria-hidden="true">
                <CalendarIcon />
              </span>
            </button>

            {openId === "when" && (
              <div className={styles.calendarWrap}>
                <CalendarDropdown
                  value={whenDate}
                  onChange={(d) => setWhenDate(d)}
                  classNames={calStyles}
                  onClose={() => setOpenId(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Комментарий */}
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label className={styles.label}>Коментар</label>

          <textarea
            className={styles.textarea}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Коротко: коли зручно, скільки людей буде, чи є тварини і інші питання…"
          />
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.clearFilters}
            onClick={() => onSubmitted?.()}
          >
            × <span>Скасувати</span>
          </button>

          <button
            type="submit"
            className={styles.searchBtn}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            Надіслати запит
          </button>
        </div>
      </div>

      <div className={styles.note}>
        MVP: зараз запит лише логиться в консоль. Далі підключимо API.
      </div>
    </form>
  );
}
