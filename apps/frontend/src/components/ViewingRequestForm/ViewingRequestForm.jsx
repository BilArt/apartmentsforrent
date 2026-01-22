import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ViewingRequestForm.module.scss";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";

import CalendarIcon from "../../assets/svg/calendar.svg?react";
import ClearIcon from "../../assets/svg/clear.svg?react";

import { requestsApi } from "../../api/requests";

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

export default function ViewingRequestForm({
  listingId,
  onCancel,
  onSuccess,
}) {
  const [open, setOpen] = useState(false);
  const calWrapRef = useRef(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState(null);
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const today = useMemo(() => startOfDay(new Date()), []);
  const dateLabel = useMemo(() => {
    if (!date) return "Обрати дату";
    if (sameDay(date, today)) return "Від сьогодні";
    return formatUaDate(date);
  }, [date, today]);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      if (calWrapRef.current && !calWrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!name.trim()) return setError("Вкажи ім'я.");
    if (!contact.trim()) return setError("Вкажи контакт.");
    if (!date) return setError("Обери дату.");

    const iso = formatISODate(date);

    const payload = {
      from: iso,
      to: iso,
      message: `Ім'я: ${name.trim()}
Контакт: ${contact.trim()}${
        comment.trim() ? `\n\nКоментар:\n${comment.trim()}` : ""
      }`,
    };

    try {
      setStatus("loading");
      await requestsApi.create(listingId, payload);
      setStatus("ok");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Не вдалося надіслати запит.");
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.subtitle}>Оголошення: {listingId}</div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.field}>
        <label className={styles.label}>Ім'я</label>
        <div className={styles.control}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Напр. Артем"
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

      <div className={styles.field}>
        <label className={styles.label}>Контакт (телефон / Telegram)</label>
        <div className={styles.control}>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+45... або @username"
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

      <div className={styles.field}>
        <label className={styles.label}>Бажана дата</label>

        <div className={styles.selectBox} ref={calWrapRef}>
          <button
            type="button"
            className={styles.selectBtn}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className={styles.selectValue}>{dateLabel}</span>
            <span className={styles.selectIcon} aria-hidden="true">
              <CalendarIcon />
            </span>
          </button>

          {open && (
            <div className={styles.calendarWrap}>
              <CalendarDropdown
                value={date}
                onChange={(d) => setDate(d)}
                classNames={calStyles}
                onClose={() => setOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Коментар</label>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Коротко: коли зручно, скільки людей буде, чи є тварини і інші питання..."
          rows={5}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={status === "loading"}
        >
          × Скасувати
        </button>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Надсилаю..." : "Надіслати запит"}
        </button>
      </div>

      <div className={styles.note}>
        MVP: запит йде на бекенд через /listings/:id/requests.
      </div>
    </form>
  );
}
