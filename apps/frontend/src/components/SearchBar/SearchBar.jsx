import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SearchBar.module.scss";

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

const WHEN_OPTIONS = [
  { id: "any", label: "Будь-коли" },
  { id: "today", label: "Сьогодні" },
  { id: "tomorrow", label: "Завтра" },
  { id: "week", label: "Цього тижня" },
];

const ROOMS_OPTIONS = [
  { id: "studio", label: "Студія" },
  { id: "1", label: "1 кімната" },
  { id: "2", label: "2 кімнати" },
  { id: "3", label: "3+ кімнати" },
];

export default function SearchBar() {
  const rootRef = useRef(null);
  const [openId, setOpenId] = useState(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationValue, setLocationValue] = useState("");

  const [whenValue, setWhenValue] = useState(WHEN_OPTIONS[0]);
  const [roomsValue, setRoomsValue] = useState(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpenId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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

  const onSearch = () => {
    const payload = {
      location: locationValue || locationQuery,
      when: whenValue?.id,
      rooms: roomsValue?.id ?? null,
    };
    console.log("SEARCH:", payload);
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

        {/* 2) Від коли */}
        <div className={styles.field}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => toggle("when")}
            aria-expanded={openId === "when"}
          >
            <span className={styles.valueText}>{whenValue.label}</span>
            <span className={styles.chevron} />
          </button>

          {openId === "when" && (
            <div className={styles.dropdownSmall}>
              <ul className={styles.list}>
                {WHEN_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => {
                        setWhenValue(opt);
                        setOpenId(null);
                      }}
                    >
                      <span className={styles.itemText}>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 3) Кількість кімнат */}
        <div className={styles.field}>
          <button
            type="button"
            className={styles.triggerText}
            onClick={() => toggle("rooms")}
            aria-expanded={openId === "rooms"}
          >
            <span className={styles.valueText}>
              {roomsValue?.label ?? "Кількість кімнат"}
            </span>
            <span className={styles.chevron} />
          </button>

          {openId === "rooms" && (
            <div className={styles.dropdownSmall}>
              <ul className={styles.list}>
                {ROOMS_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => {
                        setRoomsValue(opt);
                        setOpenId(null);
                      }}
                    >
                      <span className={styles.itemText}>{opt.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
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
