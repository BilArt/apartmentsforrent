import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./SearchPanel.module.scss";

import CalendarIcon from "../../assets/svg/calendar.svg?react";
import ChevronDownIcon from "../../assets/svg/raw.svg?react";
import ClearIcon from "../../assets/svg/clear.svg?react";

const DISTRICTS = [
  { id: "", label: "Район міста" },
  { id: "shev", label: "Шевченківський" },
  { id: "pech", label: "Печерський" },
  { id: "sol", label: "Солом'янський" },
];

const BUILDING_TYPES = [
  { id: "", label: "Обрати" },
  { id: "new", label: "Новобудова" },
  { id: "old", label: "Вторинний" },
];

const RENT_TYPES = [
  { id: "", label: "Обрати" },
  { id: "long", label: "Довгостроково" },
  { id: "short", label: "Подобово" },
];

const WHEN = [
  { id: "any", label: "Обрати дату" },
  { id: "today", label: "Сьогодні" },
  { id: "tomorrow", label: "Завтра" },
  { id: "week", label: "Цього тижня" },
];

export default function SearchPanel() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [openId, setOpenId] = useState(null);

  // refs на каждый dropdown container (selectBox)
  const dropdownRefs = useRef(new Map());

  const registerDropdownRef = (id) => (node) => {
    if (!id) return;
    if (node) dropdownRefs.current.set(id, node);
    else dropdownRefs.current.delete(id);
  };

  // close dropdown on outside click
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

  // close dropdown on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const initial = useMemo(() => {
    const getBool = (k) => sp.get(k) === "1";
    const toStr = (v) => String(v ?? "");

    return {
      city: toStr(sp.get("city") || ""),
      district: toStr(sp.get("district") || ""),
      when: toStr(sp.get("when") || "any"),
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
  }, [sp]);

  const [city, setCity] = useState(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [when, setWhen] = useState(initial.when);
  const [buildingType, setBuildingType] = useState(initial.buildingType);
  const [rentType, setRentType] = useState(initial.rentType);

  const [priceFrom, setPriceFrom] = useState(initial.priceFrom);
  const [priceTo, setPriceTo] = useState(initial.priceTo);
  const [areaFrom, setAreaFrom] = useState(initial.areaFrom);
  const [areaTo, setAreaTo] = useState(initial.areaTo);

  const [rooms, setRooms] = useState(initial.rooms);
  const [moreOpen, setMoreOpen] = useState(initial.moreOpen);

  const [kitchen, setKitchen] = useState(initial.kitchen);
  const [pets, setPets] = useState(initial.pets);
  const [lift, setLift] = useState(initial.lift);
  const [parking, setParking] = useState(initial.parking);
  const [furnished, setFurnished] = useState(initial.furnished);
  const [balcony, setBalcony] = useState(initial.balcony);
  const [storage, setStorage] = useState(initial.storage);

  const apply = () => {
    const p = new URLSearchParams();

    const setIf = (k, v) => {
      const val = String(v ?? "").trim();
      if (val) p.set(k, val);
    };

    setIf("city", city);
    setIf("district", district);
    if (when && when !== "any") p.set("when", when);
    setIf("buildingType", buildingType);
    setIf("rentType", rentType);

    setIf("priceFrom", priceFrom);
    setIf("priceTo", priceTo);
    setIf("areaFrom", areaFrom);
    setIf("areaTo", areaTo);

    if (rooms > 0) p.set("rooms", String(rooms));

    const setBool = (k, v) => v && p.set(k, "1");

    setBool("more", moreOpen);
    setBool("kitchen", kitchen);
    setBool("pets", pets);
    setBool("lift", lift);
    setBool("parking", parking);
    setBool("furnished", furnished);
    setBool("balcony", balcony);
    setBool("storage", storage);

    navigate(`/listings?${p.toString()}`);
    setOpenId(null);
  };

  const clear = () => {
    setCity("");
    setDistrict("");
    setWhen("any");
    setBuildingType("");
    setRentType("");

    setPriceFrom("");
    setPriceTo("");
    setAreaFrom("");
    setAreaTo("");

    setRooms(0);

    setKitchen(false);
    setPets(false);
    setLift(false);
    setParking(false);
    setFurnished(false);
    setBalcony(false);
    setStorage(false);

    navigate("/listings");
    setOpenId(null);
  };

  const incRooms = () => setRooms((v) => Math.min(10, (v || 0) + 1));
  const decRooms = () => setRooms((v) => Math.max(0, (v || 0) - 1));

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Пошук житла</h1>

      <div className={styles.grid}>
        {/* Місто */}
        <div className={styles.field}>
          <label className={styles.label}>Місто</label>

          <div className={styles.control}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Київ, Київська область"
            />

            {city && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setCity("")}
                aria-label="Clear city"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* Район */}
        <DropdownField
          label="Район"
          id="district"
          openId={openId}
          toggle={toggle}
          value={district}
          options={DISTRICTS}
          onPick={setDistrict}
          icon={<ChevronDownIcon />}
          registerRef={registerDropdownRef}
        />

        {/* Доступно від */}
        <DropdownField
          label="Доступно від"
          id="when"
          openId={openId}
          toggle={toggle}
          value={when}
          options={WHEN}
          onPick={setWhen}
          icon={<CalendarIcon />}
          registerRef={registerDropdownRef}
        />

        {/* Тип будови */}
        <DropdownField
          label="Тип будови"
          id="buildingType"
          openId={openId}
          toggle={toggle}
          value={buildingType}
          options={BUILDING_TYPES}
          onPick={setBuildingType}
          icon={<ChevronDownIcon />}
          registerRef={registerDropdownRef}
        />

        {/* Тип оренди */}
        <DropdownField
          label="Тип оренди"
          id="rentType"
          openId={openId}
          toggle={toggle}
          value={rentType}
          options={RENT_TYPES}
          onPick={setRentType}
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
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
            />
            <span className={styles.dash}>-</span>
            <input
              inputMode="numeric"
              placeholder="До"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
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
              value={areaFrom}
              onChange={(e) => setAreaFrom(e.target.value)}
            />
            <span className={styles.dash}>-</span>
            <input
              inputMode="numeric"
              placeholder="До"
              value={areaTo}
              onChange={(e) => setAreaTo(e.target.value)}
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
            <span className={styles.roomsValue}>{rooms || 0}</span>
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

      {/* кнопка "Більше фільтрів" — над раскрывающейся частью */}
      <div className={styles.moreRow}>
        <button
          type="button"
          className={styles.moreLink}
          onClick={() => setMoreOpen((v) => !v)}
        >
          {moreOpen ? "Менше фільтрів" : "Більше фільтрів"}
          <span className={moreOpen ? styles.chevUp : styles.chevDown} />
        </button>
      </div>

      {/* раскрывающаяся часть */}
      <div
        className={`${styles.moreCollapsible} ${moreOpen ? styles.moreOpen : ""}`}
      >
        <div className={styles.moreInner}>
          <div className={styles.toggles}>
            <Toggle
              label="Окрема кухня"
              value={kitchen}
              onChange={setKitchen}
            />
            <Toggle
              label="Допускаються тварини"
              value={pets}
              onChange={setPets}
            />
            <Toggle label="Є ліфт" value={lift} onChange={setLift} />
            <Toggle
              label="Парковочне місце"
              value={parking}
              onChange={setParking}
            />
            <Toggle label="З меблю" value={furnished} onChange={setFurnished} />
            <Toggle label="Є балкон" value={balcony} onChange={setBalcony} />
            <Toggle
              label="Є складське приміщення"
              value={storage}
              onChange={setStorage}
            />
          </div>
        </div>
      </div>

      {/* нижняя панель с кнопками — всегда после раскрывающейся части */}
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

  const currentLabel =
    options.find((o) => o.id === value)?.label ?? options[0]?.label ?? "";

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
