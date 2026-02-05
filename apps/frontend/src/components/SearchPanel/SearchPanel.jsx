import { useEffect, useMemo, useRef, useState, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./SearchPanel.module.scss";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";
import CityAutocomplete from "../CityAutocomplete/CityAutocomplete";

import CalendarIcon from "../../assets/svg/calendar.svg?react";
import ChevronDownIcon from "../../assets/svg/raw.svg?react";
import ClearIcon from "../../assets/svg/clear.svg?react";

const BUILDING_TYPES = [
  { id: "new", label: "Новобудова" },
  { id: "old", label: "Вторинний" },
];

const RENT_TYPES = [
  { id: "long", label: "Довгостроково" },
  { id: "daily", label: "Подобово" },
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
function parseISODate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);

  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return null;

  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da)
    return null;

  return startOfDay(d);
}

function readInitial(sp) {
  const getBool = (k) => sp.get(k) === "1";
  const toStr = (v) => String(v ?? "");

  const from = sp.get("from");
  const fromDate = parseISODate(sp.get("fromDate"));
  const today = startOfDay(new Date());

  let whenDate = null;
  if (from === "today") whenDate = today;
  else if (fromDate) whenDate = fromDate;

  return {
    city: toStr(sp.get("city") || ""),
    whenDate,

    buildingType: toStr(sp.get("buildingType") || ""),
    rentType: toStr(sp.get("rentType") || ""),

    priceFrom: toStr(sp.get("priceFrom") || ""),
    priceTo: toStr(sp.get("priceTo") || ""),
    areaFrom: toStr(sp.get("areaFrom") || ""),
    areaTo: toStr(sp.get("areaTo") || ""),

    rooms: Number(sp.get("rooms") || 0),
    moreOpen: getBool("more"),

    kitchen: getBool("kitchen"),
    pets: getBool("pets"),
    lift: getBool("lift"),
    parking: getBool("parking"),
    furnished: getBool("furnished"),
    balcony: getBool("balcony"),
    storage: getBool("storage"),
  };
}

function formReducer(state, action) {
  if (action.type === "replace") return action.payload;
  if (action.type === "patch") return { ...state, ...action.payload };
  return state;
}

export default function SearchPanel() {
  const [sp, setSp] = useSearchParams();

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
      if (!node) return setOpenId(null);
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

  const [form, dispatch] = useReducer(formReducer, sp, readInitial);

  // Sync with URL changes
  useEffect(() => {
    dispatch({ type: "replace", payload: readInitial(sp) });
  }, [sp.toString()]);

  const whenLabel = useMemo(() => {
    if (!form.whenDate) return "Обрати дату";
    if (sameDay(form.whenDate, today)) return "Від сьогодні";
    return formatUaDate(form.whenDate);
  }, [form.whenDate, today]);

  const incRooms = () =>
    dispatch({
      type: "patch",
      payload: { rooms: Math.min(10, (form.rooms || 0) + 1) },
    });

  const decRooms = () =>
    dispatch({
      type: "patch",
      payload: { rooms: Math.max(0, (form.rooms || 0) - 1) },
    });

  const apply = () => {
    const p = new URLSearchParams(sp);

    const setIf = (k, v) => {
      const val = String(v ?? "").trim();
      if (val) p.set(k, val);
      else p.delete(k);
    };

    setIf("city", form.city);

    p.delete("from");
    p.delete("fromDate");
    if (form.whenDate) {
      if (sameDay(form.whenDate, today)) p.set("from", "today");
      else p.set("fromDate", formatISODate(form.whenDate));
    }

    setIf("buildingType", form.buildingType);
    setIf("rentType", form.rentType);

    setIf("priceFrom", form.priceFrom);
    setIf("priceTo", form.priceTo);
    setIf("areaFrom", form.areaFrom);
    setIf("areaTo", form.areaTo);

    if (form.rooms > 0) p.set("rooms", String(form.rooms));
    else p.delete("rooms");

    const setBool = (k, v) => (v ? p.set(k, "1") : p.delete(k));

    setBool("more", form.moreOpen);
    setBool("kitchen", form.kitchen);
    setBool("pets", form.pets);
    setBool("lift", form.lift);
    setBool("parking", form.parking);
    setBool("furnished", form.furnished);
    setBool("balcony", form.balcony);
    setBool("storage", form.storage);

    p.set("page", "1");
    setSp(p, { replace: false });
    setOpenId(null);
  };

  const clear = () => {
    const empty = new URLSearchParams();
    dispatch({ type: "replace", payload: readInitial(empty) });
    setSp(empty, { replace: false });
    setOpenId(null);
  };

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Пошук житла</h1>

      <div className={styles.grid}>
        {/* Населений пункт */}
        <div className={styles.field}>
          <label className={styles.label}>Населений пункт</label>

          <div className={styles.control}>
            <CityAutocomplete
              value={form.city}
              onChange={(val) =>
                dispatch({ type: "patch", payload: { city: val || "" } })
              }
              placeholder="Обрати"
              showLabel={false}
            />

            {form.city && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() =>
                  dispatch({ type: "patch", payload: { city: "" } })
                }
                aria-label="Clear city"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Доступно від */}
        <div className={styles.field}>
          <label className={styles.label}>Доступно від</label>

          <div className={styles.selectBox} ref={registerDropdownRef("when")}>
            <button
              type="button"
              className={styles.selectBtn}
              onClick={() => toggle("when")}
              aria-expanded={openId === "when"}
            >
              <span className={styles.selectValue}>{whenLabel}</span>
              <span className={styles.selectIcon} aria-hidden="true">
                <CalendarIcon />
              </span>
            </button>

            {openId === "when" && (
              <div className={styles.calendarWrap}>
                <CalendarDropdown
                  value={form.whenDate}
                  onChange={(d) =>
                    dispatch({ type: "patch", payload: { whenDate: d } })
                  }
                  classNames={calStyles}
                  onClose={() => setOpenId(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Тип будови */}
        <DropdownField
          label="Тип будови"
          id="buildingType"
          openId={openId}
          toggle={toggle}
          value={form.buildingType}
          options={BUILDING_TYPES}
          onPick={(v) =>
            dispatch({ type: "patch", payload: { buildingType: v } })
          }
          icon={<ChevronDownIcon />}
          registerRef={registerDropdownRef}
        />

        {/* Тип оренди */}
        <DropdownField
          label="Тип оренди"
          id="rentType"
          openId={openId}
          toggle={toggle}
          value={form.rentType}
          options={RENT_TYPES}
          onPick={(v) => dispatch({ type: "patch", payload: { rentType: v } })}
          icon={<ChevronDownIcon />}
          registerRef={registerDropdownRef}
        />

        {/* Оплата */}
        <div className={styles.field}>
          <label className={styles.label}>Оплата</label>
          <div className={styles.range}>
            <input
              inputMode="numeric"
              placeholder="Від"
              value={form.priceFrom}
              onChange={(e) =>
                dispatch({
                  type: "patch",
                  payload: { priceFrom: e.target.value },
                })
              }
            />
            <span className={styles.dash}>-</span>
            <input
              inputMode="numeric"
              placeholder="До"
              value={form.priceTo}
              onChange={(e) =>
                dispatch({
                  type: "patch",
                  payload: { priceTo: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Метраж */}
        <div className={styles.field}>
          <label className={styles.label}>Метраж (м2)</label>
          <div className={styles.range}>
            <input
              inputMode="numeric"
              placeholder="Від"
              value={form.areaFrom}
              onChange={(e) =>
                dispatch({
                  type: "patch",
                  payload: { areaFrom: e.target.value },
                })
              }
            />
            <span className={styles.dash}>-</span>
            <input
              inputMode="numeric"
              placeholder="До"
              value={form.areaTo}
              onChange={(e) =>
                dispatch({ type: "patch", payload: { areaTo: e.target.value } })
              }
            />
          </div>
        </div>

        {/* Кімнати */}
        <div className={styles.field}>
          <label className={styles.label}>Кількість кімнат</label>
          <div className={styles.rooms}>
            <button
              type="button"
              className={styles.roundBtn}
              onClick={decRooms}
            >
              –
            </button>
            <span className={styles.roomsValue}>{form.rooms || 0}</span>
            <button
              type="button"
              className={styles.roundBtn}
              onClick={incRooms}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={styles.moreRow}>
        <button
          type="button"
          className={styles.moreLink}
          onClick={() =>
            dispatch({ type: "patch", payload: { moreOpen: !form.moreOpen } })
          }
        >
          {form.moreOpen ? "Менше фільтрів" : "Більше фільтрів"}
          <span className={form.moreOpen ? styles.chevUp : styles.chevDown} />
        </button>
      </div>

      <div
        className={`${styles.moreCollapsible} ${
          form.moreOpen ? styles.moreOpen : ""
        }`}
      >
        <div className={styles.moreInner}>
          <div className={styles.toggles}>
            <Toggle
              label="Окрема кухня"
              value={form.kitchen}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { kitchen: v } })
              }
            />
            <Toggle
              label="Допускаються тварини"
              value={form.pets}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { pets: v } })
              }
            />
            <Toggle
              label="Є ліфт"
              value={form.lift}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { lift: v } })
              }
            />
            <Toggle
              label="Парковочне місце"
              value={form.parking}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { parking: v } })
              }
            />
            <Toggle
              label="З меблю"
              value={form.furnished}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { furnished: v } })
              }
            />
            <Toggle
              label="Є балкон"
              value={form.balcony}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { balcony: v } })
              }
            />
            <Toggle
              label="Є складське приміщення"
              value={form.storage}
              onChange={(v) =>
                dispatch({ type: "patch", payload: { storage: v } })
              }
            />
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.actions}>
          <button type="button" className={styles.clearFilters} onClick={clear}>
            × <span>Вичистити фільтри</span>
          </button>

          <button type="button" className={styles.searchBtn} onClick={apply}>
            Знайти
          </button>
        </div>
      </div>
    </section>
  );
}

function DropdownField({
  label,
  id,
  openId,
  toggle,
  value,
  options,
  onPick,
  icon,
  registerRef,
}) {
  const isOpen = openId === id;

  const currentLabel = value
    ? (options.find((o) => o.id === value)?.label ?? "Обрати")
    : "Обрати";

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>

      <div className={styles.selectBox} ref={registerRef(id)}>
        <button
          type="button"
          className={styles.selectBtn}
          onClick={() => toggle(id)}
          aria-expanded={isOpen}
        >
          <span className={styles.selectValue}>{currentLabel}</span>
          <span className={styles.selectIcon} aria-hidden="true">
            {icon}
          </span>
        </button>

        {isOpen && (
          <div className={styles.dropdownSmall}>
            <ul className={styles.list}>
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => {
                      onPick(opt.id);
                      toggle(id);
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
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <button
        type="button"
        className={`${styles.toggle} ${value ? styles.toggleOn : ""}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className={styles.knob} />
      </button>
    </label>
  );
}
