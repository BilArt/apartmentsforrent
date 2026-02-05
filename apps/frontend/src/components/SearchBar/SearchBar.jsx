import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import styles from "./SearchBar.module.scss";
import { useNavigate, useSearchParams } from "react-router-dom";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";

import SearchIcon from "../../assets/svg/search.svg?react";
import LocationIcon from "../../assets/svg/location.svg?react";
import TimerIcon from "../../assets/svg/timer.svg?react";
import LocationSmallIcon from "../../assets/svg/location.svg?react";

const LS_LAST_CITIES = "afr:lastCities:v1";
const LS_CITY_POP = "afr:cityPopularity:v1";

const POPULAR_SEED = [
  { id: "kyiv", label: "Київ, Київська область" },
  { id: "lviv", label: "Львів, Львівська область" },
  { id: "odesa", label: "Одеса, Одеська область" },
];

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("localStorage error:", err);
  }
}

function normalizeCityLabel(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatUaDate(d) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);

  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }

  dt.setHours(0, 0, 0, 0);
  return dt;
}

function isSameDate(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function readInitialFromSearchParams(sp) {
  const city = normalizeCityLabel(sp.get("city") || "");
  const initialFromToday = sp.get("from") === "today";
  const initialFromDate = parseISODate(sp.get("fromDate") || "");

  return {
    locationQuery: city,
    locationValue: city,

    fromToday: initialFromToday,
    selectedDate: initialFromToday ? null : initialFromDate,

    roomsCount: Number(sp.get("rooms") || 0),
    kitchen: sp.get("kitchen") === "1",
  };
}

function reducer(state, action) {
  if (action.type === "replace") return action.payload;
  if (action.type === "patch") return { ...state, ...action.payload };
  return state;
}

function cityLabelFromApiItem(s) {
  return normalizeCityLabel(s?.nameUk || s?.name || "");
}

export default function SearchBar() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const rootRef = useRef(null);
  const locationInputRef = useRef(null);

  const [openId, setOpenId] = useState(null);
  const [form, dispatch] = useReducer(reducer, sp, readInitialFromSearchParams);

  const [lastCities, setLastCities] = useState(() =>
    loadJson(LS_LAST_CITIES, []),
  );
  const [cityPop, setCityPop] = useState(() => loadJson(LS_CITY_POP, {}));

  const [geoItems, setGeoItems] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);

  const geoAbortRef = useRef(null);
  const geoTimerRef = useRef(null);

  useEffect(() => {
    dispatch({ type: "replace", payload: readInitialFromSearchParams(sp) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpenId(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const rememberCity = (label) => {
    const city = normalizeCityLabel(label);
    if (!city) return;

    setLastCities((prev) => {
      const next = [city, ...prev.filter((x) => x !== city)].slice(0, 3);
      saveJson(LS_LAST_CITIES, next);
      return next;
    });

    setCityPop((prev) => {
      const next = { ...prev, [city]: (prev[city] || 0) + 1 };
      saveJson(LS_CITY_POP, next);
      return next;
    });
  };

  const popularCities = useMemo(() => {
    const entries = Object.entries(cityPop);
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 3).map(([label]) => label);

    const merged = top.length ? top : POPULAR_SEED.map((x) => x.label);
    return Array.from(new Set(merged))
      .slice(0, 3)
      .map((label) => ({ id: label.toLowerCase(), label }));
  }, [cityPop]);

  const lastItems = useMemo(
    () => lastCities.map((label) => ({ id: label.toLowerCase(), label })),
    [lastCities],
  );

  useEffect(() => {
    const q = form.locationQuery.trim();

    if (geoTimerRef.current) clearTimeout(geoTimerRef.current);

    if (geoAbortRef.current) {
      geoAbortRef.current.abort();
      geoAbortRef.current = null;
    }

    if (q.length < 2) {
      setGeoItems([]);
      setGeoLoading(false);
      return;
    }

    geoTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      geoAbortRef.current = controller;

      setGeoLoading(true);

      try {
        const url = new URL("/geo/ua/settlements", window.location.origin);
        url.searchParams.set("q", q);
        url.searchParams.set("limit", "3");

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          credentials: "include",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        const mapped = arr
          .map((s) => ({
            id: String(s.id),
            label: cityLabelFromApiItem(s),
          }))
          .filter((x) => x.label);

        const uniq = Array.from(
          new Map(mapped.map((x) => [x.label, x])).values(),
        ).slice(0, 3);

        setGeoItems(uniq);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setGeoItems([]);
      } finally {
        setGeoLoading(false);
      }
    }, 250);

    return () => {
      if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
    };
  }, [form.locationQuery]);

  const pickLocation = (item) => {
    dispatch({
      type: "patch",
      payload: { locationValue: item.label, locationQuery: item.label },
    });
    setGeoItems([]);
    setOpenId(null);
  };

  const whenLabel = useMemo(() => {
    if (form.fromToday) return "Від сьогодні";
    if (form.selectedDate) return formatUaDate(form.selectedDate);
    return "Від коли";
  }, [form.fromToday, form.selectedDate]);

  const roomsLabel = useMemo(() => {
    if (!form.roomsCount) return "Кількість кімнат";
    return `Кількість кімнат: ${form.roomsCount}`;
  }, [form.roomsCount]);

  const decRooms = () =>
    dispatch({
      type: "patch",
      payload: { roomsCount: Math.max(0, (form.roomsCount || 0) - 1) },
    });

  const incRooms = () =>
    dispatch({
      type: "patch",
      payload: { roomsCount: Math.min(10, (form.roomsCount || 0) + 1) },
    });

  const onPickDate = (d) => {
    if (!d) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const picked = new Date(d);
    picked.setHours(0, 0, 0, 0);

    if (isSameDate(today, picked)) {
      dispatch({
        type: "patch",
        payload: { fromToday: true, selectedDate: null },
      });
    } else {
      dispatch({
        type: "patch",
        payload: { fromToday: false, selectedDate: picked },
      });
    }

    setOpenId(null);
  };

  const onSearch = () => {
    const city = normalizeCityLabel(
      form.locationValue || form.locationQuery || "",
    );

    const params = new URLSearchParams();
    if (city) params.set("city", city);

    if (form.fromToday) params.set("from", "today");
    else if (form.selectedDate)
      params.set("fromDate", formatISODate(form.selectedDate));

    if (form.roomsCount > 0) params.set("rooms", String(form.roomsCount));

    if (form.kitchen) {
      params.set("kitchen", "1");
      params.set("more", "1");
    }

    if (city) rememberCity(city);

    navigate(`/listings?${params.toString()}`);
    setOpenId(null);
  };

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <div className={styles.bar}>
        {/* LOCATION */}
        <div className={`${styles.field} ${styles.fieldLocation}`}>
          <div
            className={styles.trigger}
            role="button"
            tabIndex={-1}
            onMouseDown={() => {
              setOpenId("location");
              requestAnimationFrame(() => locationInputRef.current?.focus());
            }}
            aria-expanded={openId === "location"}
          >
            <div className={styles.inputWrap}>
              <input
                ref={locationInputRef}
                className={styles.input}
                placeholder="Місцезнаходження"
                value={form.locationQuery}
                onChange={(e) => {
                  dispatch({
                    type: "patch",
                    payload: { locationQuery: e.target.value },
                  });
                  setOpenId("location");
                }}
                onFocus={() => setOpenId("location")}
              />

              <span className={styles.locationIcon} aria-hidden="true">
                <LocationIcon />
              </span>
            </div>
          </div>

          {openId === "location" && (
            <div className={styles.dropdown}>
              {!!geoItems.length && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>
                    Підказки
                    {geoLoading ? "…" : ""}
                  </div>

                  <ul className={styles.list}>
                    {geoItems.map((item) => (
                      <li key={`geo-${item.id}`}>
                        <button
                          type="button"
                          className={styles.item}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickLocation(item)}
                        >
                          <span className={styles.icon} aria-hidden="true">
                            <LocationSmallIcon />
                          </span>
                          <span className={styles.itemText}>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!!lastItems.length && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>Останній пошук</div>
                  <ul className={styles.list}>
                    {lastItems.map((item) => (
                      <li key={`last-${item.id}`}>
                        <button
                          type="button"
                          className={styles.item}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickLocation(item)}
                        >
                          <span className={styles.icon} aria-hidden="true">
                            <TimerIcon />
                          </span>
                          <span className={styles.itemText}>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!!popularCities.length && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>Популярне</div>
                  <ul className={styles.list}>
                    {popularCities.map((item) => (
                      <li key={`pop-${item.id}`}>
                        <button
                          type="button"
                          className={styles.item}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickLocation(item)}
                        >
                          <span className={styles.icon} aria-hidden="true">
                            <LocationSmallIcon />
                          </span>
                          <span className={styles.itemText}>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* WHEN */}
        <div className={`${styles.field} ${styles.fieldWhen}`}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => setOpenId(openId === "when" ? null : "when")}
            aria-expanded={openId === "when"}
          >
            <span className={styles.valueText}>{whenLabel}</span>
            <span
              className={`${styles.chevron} ${
                openId === "when" ? styles.chevUp : styles.chevDown
              }`}
            />
          </button>

          {openId === "when" && (
            <div className={styles.calendarWrap}>
              <CalendarDropdown
                value={form.fromToday ? new Date() : form.selectedDate}
                onChange={onPickDate}
                classNames={calStyles}
                onClose={() => setOpenId(null)}
              />
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* ROOMS */}
        <div className={`${styles.field} ${styles.fieldRooms}`}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => setOpenId(openId === "rooms" ? null : "rooms")}
            aria-expanded={openId === "rooms"}
          >
            <span className={styles.valueText}>{roomsLabel}</span>
            <span
              className={`${styles.chevron} ${
                openId === "rooms" ? styles.chevUp : styles.chevDown
              }`}
            />
          </button>

          {openId === "rooms" && (
            <div className={`${styles.dropdownRooms} ${styles.popAnim}`}>
              <div className={styles.roomsRow}>
                <div className={styles.roomsTitle}>Кількість кімнат</div>

                <div className={styles.counter}>
                  <button
                    type="button"
                    className={styles.counterBtn}
                    onClick={decRooms}
                    aria-label="Decrease rooms"
                  >
                    –
                  </button>
                  <div className={styles.counterValue}>{form.roomsCount}</div>
                  <button
                    type="button"
                    className={styles.counterBtn}
                    onClick={incRooms}
                    aria-label="Increase rooms"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.roomsDivider} />

              <div className={styles.toggleRow}>
                <div className={styles.toggleLabel}>Окрема кухня</div>
                <button
                  type="button"
                  className={`${styles.toggle} ${
                    form.kitchen ? styles.toggleOn : ""
                  }`}
                  onClick={() =>
                    dispatch({
                      type: "patch",
                      payload: { kitchen: !form.kitchen },
                    })
                  }
                  aria-pressed={form.kitchen}
                >
                  <span className={styles.knob} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH */}
        <button
          type="button"
          className={styles.searchBtn}
          onClick={onSearch}
          aria-label="Search"
        >
          <SearchIcon className={styles.searchIcon} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
