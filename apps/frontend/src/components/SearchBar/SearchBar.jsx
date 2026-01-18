import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SearchBar.module.scss";
import { useNavigate, useSearchParams } from "react-router-dom";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";

import SearchIcon from "../../assets/svg/search.svg?react";
import LocationIcon from "../../assets/svg/location.svg?react";
import TimerIcon from "../../assets/svg/timer.svg?react";
import LocationSmallIcon from "../../assets/svg/location.svg?react";

const LAST_SEARCH = [
  { id: "kyiv", label: "Київ, Київська область" },
  { id: "lviv", label: "Львів, Львівська область" },
  { id: "odesa", label: "Одеса, Одеська область" },
];

const POPULAR = [
  { id: "kyiv2", label: "Київ, Київська область" },
  { id: "chernivtsi", label: "Чернівці, Чернівецька область" },
  { id: "bukovel", label: "Буковель, Івано-Франківська область" },
];

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

export default function SearchBar({ variant = "pill" }) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const rootRef = useRef(null);
  const [openId, setOpenId] = useState(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationValue, setLocationValue] = useState("");

  const initialFromToday = sp.get("from") === "today";
  const initialFromDate = parseISODate(sp.get("fromDate") || "");
  const [fromToday, setFromToday] = useState(initialFromToday);
  const [selectedDate, setSelectedDate] = useState(
    initialFromToday ? null : initialFromDate
  );

  const [roomsCount, setRoomsCount] = useState(Number(sp.get("rooms") || 0));
  const [kitchen, setKitchen] = useState(sp.get("kitchen") === "1");

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

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return { last: LAST_SEARCH, popular: POPULAR };
    const all = [...LAST_SEARCH, ...POPULAR];
    const uniq = Array.from(new Map(all.map((x) => [x.id, x])).values());
    return {
      last: [],
      popular: uniq.filter((x) => x.label.toLowerCase().includes(q)),
    };
  }, [locationQuery]);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const pickLocation = (item) => {
    setLocationValue(item.label);
    setLocationQuery(item.label);
    setOpenId(null);
  };

  const whenLabel = useMemo(() => {
    if (fromToday) return "Від сьогодні";
    if (selectedDate) return formatUaDate(selectedDate);
    return "Від коли";
  }, [fromToday, selectedDate]);

  const roomsLabel = useMemo(() => {
    if (!roomsCount) return "Кількість кімнат";
    return `Кількість кімнат: ${roomsCount}`;
  }, [roomsCount]);

  const decRooms = () => setRoomsCount((v) => Math.max(0, v - 1));
  const incRooms = () => setRoomsCount((v) => Math.min(10, v + 1));

  const onPickToday = () => {
    setFromToday(true);
    setSelectedDate(null);
    setOpenId(null);
  };

  const onPickDate = (d) => {
    if (!d) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const picked = new Date(d);
    picked.setHours(0, 0, 0, 0);

    if (isSameDate(today, picked)) {
      setFromToday(true);
      setSelectedDate(null);
    } else {
      setFromToday(false);
      setSelectedDate(picked);
    }

    setOpenId(null);
  };

  const onSearch = () => {
    const city = (locationValue || locationQuery || "").trim();

    const params = new URLSearchParams();
    if (city) params.set("city", city);

    if (fromToday) {
      params.set("from", "today");
    } else if (selectedDate) {
      params.set("fromDate", formatISODate(selectedDate));
    }

    if (roomsCount > 0) params.set("rooms", String(roomsCount));
    if (kitchen) params.set("kitchen", "1");

    navigate(`/listings?${params.toString()}`);
    setOpenId(null);
  };

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <div className={styles.bar}>
        {/* 1) Локация */}
        <div className={styles.field}>
          <button
            type="button"
            className={styles.trigger}
            onClick={() => toggle("location")}
            aria-expanded={openId === "location"}
          >
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                placeholder="Місцезнаходження"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setOpenId("location");
                }}
                onFocus={() => setOpenId("location")}
              />

              <span className={styles.locationIcon} aria-hidden="true">
                <LocationIcon />
              </span>
            </div>
          </button>

          {openId === "location" && (
            <div className={styles.dropdown}>
              {!!filteredLocations.last.length && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>Останній пошук</div>
                  <ul className={styles.list}>
                    {filteredLocations.last.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={styles.item}
                          onClick={() => pickLocation(item)}
                        >
                          <span className={styles.icon}>
                            <TimerIcon />
                          </span>
                          <span className={styles.itemText}>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button type="button" className={styles.moreBtn}>
                    більше &gt;
                  </button>
                </section>
              )}

              <section className={styles.section}>
                <div className={styles.sectionTitle}>Популярне</div>
                <ul className={styles.list}>
                  {filteredLocations.popular.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={styles.item}
                        onClick={() => pickLocation(item)}
                      >
                        <span className={styles.icon}>
                          <LocationSmallIcon />
                        </span>
                        <span className={styles.itemText}>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 2) Від коли — календарь через CalendarDropdown */}
        <div className={styles.field}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => toggle("when")}
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
                value={fromToday ? new Date() : selectedDate}
                onChange={(d) => onPickDate(d)}
                classNames={calStyles}
                onClose={() => setOpenId(null)}
              />
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 3) Кількість кімнат — панелька */}
        <div className={styles.field}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => toggle("rooms")}
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
                  <div className={styles.counterValue}>{roomsCount}</div>
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
                    kitchen ? styles.toggleOn : ""
                  }`}
                  onClick={() => setKitchen((v) => !v)}
                  aria-pressed={kitchen}
                >
                  <span className={styles.knob} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Кнопка поиска */}
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
