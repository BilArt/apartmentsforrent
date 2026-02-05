import { useEffect, useRef, useState } from "react";
import styles from "./CityAutocomplete.module.scss";

const API_BASE = import.meta.env.VITE_API_URL || "";

function displayName(s) {
  return s?.nameUk || s?.name || "";
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function buildUrl(q, limit) {
  const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
  const url = new URL(`${base}/geo/ua/settlements`, window.location.origin);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  return url.toString();
}

function CityAutocomplete({
  value,
  onChange,

  label = "Населений пункт",
  showLabel = true,

  placeholder = "Почніть вводити (місто/село/смт)…",
  limit = 10,

  inputClassName,
  dropdownClassName,
  optionClassName,
}) {
  const [query, setQuery] = useState(String(value || ""));
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const abortRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(String(value || ""));
  }, [value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();

    if (q.length === 0) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      if (String(value || "") !== "") onChange?.("");
      return;
    }

    if (
      String(value || "")
        .trim()
        .toLowerCase() === q.toLowerCase()
    ) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (q.length < 2) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErr(null);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(buildUrl(q, limit), {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        setResults(arr);
        setOpen(arr.length > 0);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setErr("Не вдалося завантажити список. Перевір API.");
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query, limit, onChange, value]);

  const handlePick = (s) => {
    const name = displayName(s) || "";
    onChange?.(name);
    setQuery(name);
    setOpen(false);
    setResults([]);
    setErr(null);
  };

  const handleBlur = () => {
    const q = query.trim();
    if (!q) return;

    const v = String(value || "").trim();
    if (v && v.toLowerCase() !== q.toLowerCase()) {
      setQuery(v);
    }
  };

  const inputEl = (
    <>
      <div className={styles.inputRow}>
        <input
          type="text"
          className={cx(styles.input, inputClassName)}
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={handleBlur}
          autoComplete="off"
        />
        {loading && <span className={styles.loader}>…</span>}
      </div>

      {err && <p className={styles.error}>{err}</p>}

      {open && results.length > 0 && (
        <ul className={cx(styles.dropdown, dropdownClassName)}>
          {results.map((s) => (
            <li
              key={s.id}
              className={cx(styles.item, optionClassName)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(s)}
            >
              <div className={styles.title}>{displayName(s) || s.name}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {showLabel ? (
        <label className={styles.field}>
          <span className={styles.label}>{label}</span>
          {inputEl}
        </label>
      ) : (
        inputEl
      )}
    </div>
  );
}

export default CityAutocomplete;
