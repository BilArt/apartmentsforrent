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

function emitRequestCreated(listingId) {
  if (!listingId) return;

  const detail = { listingId: String(listingId), status: "PENDING" };

  window.dispatchEvent(new CustomEvent("requestCreated", { detail }));
  window.dispatchEvent(new CustomEvent("requestStatusChanged", { detail }));
}

const UA_PREFIX = "+380";
const UA_PHONE_RE = /^\+380\d{9}$/;

function digitsOnly(v) {
  return String(v ?? "").replace(/\D+/g, "");
}

function normalizeUaPhone(input) {
  const d = digitsOnly(input);

  if (!d) return UA_PREFIX;

  if (d.startsWith("0") && d.length >= 10) {
    return UA_PREFIX + d.slice(1, 10);
  }

  if (d.startsWith("380")) {
    return UA_PREFIX + d.slice(3, 12);
  }

  if (d.length >= 9) {
    return UA_PREFIX + d.slice(0, 9);
  }

  return UA_PREFIX + d;
}

function clampUaPhone(input) {
  const normalized = normalizeUaPhone(input);
  return normalized.slice(0, 13);
}

function validatePhone(raw) {
  const value = clampUaPhone(raw);

  if (!value || value === UA_PREFIX) {
    return { ok: false, value, message: "Вкажи номер телефону." };
  }

  if (!UA_PHONE_RE.test(value)) {
    return {
      ok: false,
      value,
      message: "Телефон має бути у форматі +380XXXXXXXXX (Україна).",
    };
  }

  return { ok: true, value, message: "" };
}

export default function ViewingRequestForm({ listingId, onCancel, onSuccess }) {
  const [open, setOpen] = useState(false);
  const calWrapRef = useRef(null);

  const [contact, setContact] = useState(UA_PREFIX);
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

    const cleanComment = comment.trim();

    const phoneCheck = validatePhone(contact);
    if (!phoneCheck.ok) {
      setContact(phoneCheck.value);
      return setError(phoneCheck.message);
    }

    if (!date) return setError("Обери дату.");

    const iso = formatISODate(date);

    const payload = {
      from: iso,
      to: iso,
      message: `Контакт: ${phoneCheck.value}${
        cleanComment ? `\n\nКоментар:\n${cleanComment}` : ""
      }`,
    };

    try {
      setStatus("loading");

      await requestsApi.create(listingId, payload);

      emitRequestCreated(listingId);

      setStatus("ok");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Не вдалося надіслати запит.");
    }
  };

  const onContactChange = (e) => {
    const next = clampUaPhone(e.target.value);

    if (!next.startsWith(UA_PREFIX)) {
      setContact(UA_PREFIX);
    } else {
      setContact(next);
    }

    if (error) setError("");
  };

  const onContactBlur = () => {
    const normalized = clampUaPhone(contact);
    setContact(normalized || UA_PREFIX);

    const check = validatePhone(normalized);
    if (!check.ok) setError(check.message);
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.field}>
        <label className={styles.label}>Номер телефону</label>
        <div className={styles.control}>
          <input
            value={contact}
            onChange={onContactChange}
            onBlur={onContactBlur}
            placeholder="+380XXXXXXXXX"
            autoComplete="tel"
            inputMode="tel"
          />
          {contact && contact !== UA_PREFIX && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setContact(UA_PREFIX)}
              aria-label="Clear phone"
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
    </form>
  );
}
