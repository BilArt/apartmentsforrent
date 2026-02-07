import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CityAutocomplete.module.scss";
import { API_BASE_URL } from "../../api/config";

function displayName(s) {
  return s?.nameUk || s?.name || "";
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function buildUrl(q, limit) {
  const base = String(API_BASE_URL || "").replace(/\/$/, "");
  const url = `${base}/geo/ua/settlements?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(
    String(limit),
  )}`;
  return url;
}

function valueToLabel(value, valueMode) {
  if (!value) return "";
  if (valueMode === "object") return displayName(value) || "";
  return String(value || "");
}

export default function CityAutocomplete({
  value,
  onChange,

  valueMode = "string",

  label = "Населений пункт",
  showLabel = true,

  placeholder = "Почніть вводити (місто/село/смт)…",
  limit = 10,

  inputClassName,
  dropdownClassName,
  optionClassName,
}) {
  const [query, setQuery] = useState(() => valueToLabel(value, valueMode));
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const abortRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(valueToLabel(value, valueMode));
  }, [value, valueMode]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const currentLabel = useMemo(
    () => valueToLabel(value, valueMode).trim(),
    [value, valueMode],
  );

  useEffect(() => {
    const q = query.trim();

    if (q.length === 0) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);

      if (valueMode === "object") {
        if (value) onChange?.(null);
      } else {
        if (String(value || "") !== "") onChange?.("");
      }

      return;
    }

    if (currentLabel && currentLabel.toLowerCase() === q.toLowerCase()) {
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

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
        }

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
  }, [query, limit, onChange, value, valueMode, currentLabel]);

  const handlePick = (s) => {
    const name = displayName(s) || "";

    if (valueMode === "object") {
      onChange?.(s);
      setQuery(name);
    } else {
      onChange?.(name);
      setQuery(name);
    }

    setOpen(false);
    setResults([]);
    setErr(null);
  };

  const handleBlur = () => {
    const q = query.trim();
    if (!q) return;

    if (currentLabel && currentLabel.toLowerCase() !== q.toLowerCase()) {
      setQuery(currentLabel);
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
              key={String(s?.id ?? s?.geonameId ?? displayName(s))}
              className={cx(styles.item, optionClassName)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(s)}
            >
              <div className={styles.title}>{displayName(s) || s?.name}</div>
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
