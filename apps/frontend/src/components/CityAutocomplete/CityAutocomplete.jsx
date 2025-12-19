import { useEffect, useRef, useState } from "react";
import styles from "./CityAutocomplete.module.scss";

/**
 * settlement shape from backend:
 * { id, name, nameUk?, admin1?, admin2?, lat, lon, population, featureCode }
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function displayName(s) {
  return s?.nameUk || s?.name || "";
}

function CityAutocomplete({
  value, // selected settlement object or null
  onChange, // (settlement|null) => void
  label = "Населений пункт",
  placeholder = "Почніть вводити (місто/село/смт)…",
  limit = 10,
}) {
  const [query, setQuery] = useState(value ? displayName(value) : "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const abortRef = useRef(null);
  const containerRef = useRef(null);

  // Sync input text when parent changes selected value
  useEffect(() => {
    setQuery(value ? displayName(value) : "");
  }, [value]);

  // Close on outside click
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
    // If user cleared input manually — clear selection too
    if (q.length === 0) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      if (value !== null) onChange?.(null);
      return;
    }

    // If input exactly equals selected displayName -> don't refetch
    if (value && displayName(value).toLowerCase() === q.toLowerCase()) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    // Avoid spamming backend
    if (q.length < 2) {
      setResults([]);
      setErr(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    const url = new URL(`${API_BASE}/geo/ua/settlements`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErr(null);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(url.toString(), {
          signal: controller.signal,
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (e) {
        if (e.name === "AbortError") return;
        setErr("Не вдалося завантажити список. Перевір API.");
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250); // debounce

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handlePick = (s) => {
    onChange?.(s);
    setQuery(displayName(s));
    setOpen(false);
    setResults([]);
    setErr(null);
  };

  const handleBlur = () => {
    // If user typed something but didn't select -> revert to selected or clear
    const q = query.trim();
    if (!q) return;

    if (value) {
      const selected = displayName(value);
      if (selected.toLowerCase() !== q.toLowerCase()) {
        setQuery(selected);
      }
    }
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <label className={styles.field}>
        <span>{label}</span>

        <div className={styles.inputRow}>
          <input
            type="text"
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
      </label>

      {err && <p className={styles.error}>{err}</p>}

      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((s) => (
            <li
              key={s.id}
              className={styles.item}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => handlePick(s)}
            >
              <div className={styles.title}>{displayName(s) || s.name}</div>
              <div className={styles.meta}>
                {s.nameUk ? s.name : null}
                {s.admin1 ? ` • admin1:${s.admin1}` : ""}
                {typeof s.population === "number" && s.population > 0
                  ? ` • pop:${s.population}`
                  : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CityAutocomplete;
