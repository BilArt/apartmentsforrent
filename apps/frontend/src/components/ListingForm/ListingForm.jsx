import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ListingForm.module.scss";
import CityAutocomplete from "../CityAutocomplete/CityAutocomplete";
import { listingsApi } from "../../api/listings";

import CalendarDropdown from "../CalendarDropdown/CalendarDropdown";
import calStyles from "../CalendarDropdown/CalendarDropdown.module.scss";
import CalendarIcon from "../../assets/svg/calendar.svg?react";

const DEFAULT_FEATURES = {
  kitchen: false,
  balcony: false,
  pets: false,
  lift: false,
  parking: false,
  furnished: false,
  storage: false,
};

const MAX_FILES = 10;

function toCityAutocompleteValue(city) {
  if (!city) return null;

  if (city.id) return city;

  if (city.geonameId) {
    return {
      id: String(city.geonameId),
      name: city.name,
      nameUk: city.nameUk,
      admin1: city.admin1,
      admin2: city.admin2,
      lat: city.lat,
      lon: city.lon,
    };
  }

  return null;
}

function toApiCityPayload(city) {
  if (!city) return null;
  return {
    geonameId: Number(city.id),
    name: city.name,
    nameUk: city.nameUk,
    admin1: city.admin1,
    admin2: city.admin2,
    lat: Number(city.lat),
    lon: Number(city.lon),
  };
}

function toFeaturesValue(initialValue) {
  const f = initialValue?.features ?? initialValue ?? {};
  return {
    kitchen: Boolean(f.kitchen),
    balcony: Boolean(f.balcony),
    pets: Boolean(f.pets),
    lift: Boolean(f.lift),
    parking: Boolean(f.parking),
    furnished: Boolean(f.furnished),
    storage: Boolean(f.storage),
  };
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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatUaDate(d) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
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

function toDateOnlyString(value) {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  return "";
}

function toNumOrEmpty(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() !== "") return value;
  return "";
}

function toNullableNumberFromInput(s) {
  const v = String(s ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ✅ Сжатие до 600x600 (fit inside), jpeg
async function compressToJpeg600(file, size = 600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });

  if (!blob) throw new Error("Image compression failed");

  const nameBase = (file.name || "image").replace(/\.[^.]+$/, "");
  return new File([blob], `${nameBase}.jpg`, { type: "image/jpeg" });
}

export default function ListingForm({
  mode = "create",
  initialValue = null,
  onCreated,
  onSubmitted,
}) {
  const isEdit = mode === "edit";

  const initialTitle = initialValue?.title || "";
  const initialCity = useMemo(
    () => toCityAutocompleteValue(initialValue?.city),
    [initialValue?.city],
  );
  const initialAddress = initialValue?.address || "";
  const initialDescription = initialValue?.description || "";
  const initialPrice =
    typeof initialValue?.price === "number" ? String(initialValue.price) : "";

  const initialArea = toNumOrEmpty(initialValue?.area);
  const initialRooms = toNumOrEmpty(initialValue?.rooms);

  const initialAvailableFrom = useMemo(() => {
    const s = toDateOnlyString(initialValue?.availableFrom);
    return s ? parseISODate(s) : null;
  }, [initialValue?.availableFrom]);

  const initialFeatures = useMemo(
    () => (initialValue ? toFeaturesValue(initialValue) : DEFAULT_FEATURES),
    [initialValue],
  );

  const initialImages = useMemo(() => {
    const imgs = initialValue?.images;
    return Array.isArray(imgs) ? imgs.filter((x) => typeof x === "string") : [];
  }, [initialValue?.images]);

  const [title, setTitle] = useState(initialTitle);
  const [city, setCity] = useState(initialCity);
  const [address, setAddress] = useState(initialAddress);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(initialPrice);

  const [area, setArea] = useState(initialArea);
  const [rooms, setRooms] = useState(initialRooms);

  const [availableFromDate, setAvailableFromDate] =
    useState(initialAvailableFrom);

  const [features, setFeatures] = useState(initialFeatures);

  const [images, setImages] = useState(initialImages);
  const [localFileNames, setLocalFileNames] = useState([]);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [whenOpen, setWhenOpen] = useState(false);
  const whenWrapRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!whenOpen) return;
      if (!whenWrapRef.current) return setWhenOpen(false);
      if (!whenWrapRef.current.contains(e.target)) setWhenOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [whenOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setWhenOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setTitle(initialTitle);
    setCity(initialCity);
    setAddress(initialAddress);
    setDescription(initialDescription);
    setPrice(initialPrice);

    setArea(initialArea);
    setRooms(initialRooms);
    setAvailableFromDate(initialAvailableFrom);

    setFeatures(initialFeatures);
    setImages(initialImages);
    setLocalFileNames([]);

    setError(null);
    setWhenOpen(false);
  }, [
    initialTitle,
    initialCity,
    initialAddress,
    initialDescription,
    initialPrice,
    initialArea,
    initialRooms,
    initialAvailableFrom,
    initialFeatures,
    initialImages,
  ]);

  const clearErrorOnChange = () => {
    if (error) setError(null);
  };

  const patchFeature = (key, value) => {
    setFeatures((prev) => ({ ...prev, [key]: Boolean(value) }));
    clearErrorOnChange();
  };

  const today = useMemo(() => startOfDay(new Date()), []);
  const whenLabel = useMemo(() => {
    if (!availableFromDate) return "Обрати дату";
    if (sameDay(availableFromDate, today)) return "Від сьогодні";
    return formatUaDate(availableFromDate);
  }, [availableFromDate, today]);

  const handleImagesChange = async (e) => {
    const list = e.target.files;
    if (!list) return;

    const files = Array.from(list);

    if (files.length === 0) return;
    if (files.length > MAX_FILES) {
      setError(`Можна завантажити максимум ${MAX_FILES} фото.`);
      e.target.value = "";
      return;
    }

    setIsUploadingImages(true);
    setError(null);

    try {
      setLocalFileNames(files.map((f) => f.name));

      const compressed = [];
      for (const f of files) {
        compressed.push(await compressToJpeg600(f, 600, 0.82));
      }

      const res = await listingsApi.uploadListingImages(compressed);

      const imgs = Array.isArray(res?.images) ? res.images : [];
      if (imgs.length < 1) throw new Error("Не вдалося завантажити фото.");

      setImages((prev) => {
        const merged = [...prev, ...imgs].slice(0, MAX_FILES);
        return merged;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setIsUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUploadingImages) {
      setError("Зачекайте, фото ще завантажуються…");
      return;
    }

    if (!title || !city || !address || !description || price === "") {
      setError("Заповніть усі поля, будь-ласка.");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Ціна має бути числом і не менше 0.");
      return;
    }

    const areaNum = toNullableNumberFromInput(area);
    if (areaNum !== null && areaNum < 0) {
      setError("Метраж має бути числом і не менше 0.");
      return;
    }

    const roomsNum = toNullableNumberFromInput(rooms);
    if (roomsNum !== null && roomsNum < 0) {
      setError("Кількість кімнат має бути числом і не менше 0.");
      return;
    }

    const availableFromPayload = availableFromDate
      ? formatISODate(availableFromDate)
      : undefined;

    if (images.length > MAX_FILES) {
      setError(`Максимум ${MAX_FILES} фото.`);
      return;
    }

    const payload = {
      title,
      description,
      address,
      price: priceNumber,
      city: toApiCityPayload(city),

      area: areaNum === null ? undefined : areaNum,
      rooms: roomsNum === null ? undefined : roomsNum,
      availableFrom: availableFromPayload,

      kitchen: features.kitchen,
      balcony: features.balcony,
      pets: features.pets,
      lift: features.lift,
      parking: features.parking,
      furnished: features.furnished,
      storage: features.storage,

      images: images.length ? images : undefined,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      let data;

      if (isEdit) {
        const id = initialValue?.id;
        if (!id) throw new Error("Не знайдено ID оголошення для редагування.");
        data = await listingsApi.update(id, payload);
      } else {
        data = await listingsApi.create(payload);
        onCreated?.(data);
      }

      onSubmitted?.(data);

      if (!isEdit) {
        setTitle("");
        setCity(null);
        setAddress("");
        setDescription("");
        setPrice("");

        setArea("");
        setRooms("");
        setAvailableFromDate(null);

        setFeatures(DEFAULT_FEATURES);

        setImages([]);
        setLocalFileNames([]);

        setWhenOpen(false);
      }
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Назва оголошення</span>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearErrorOnChange();
          }}
        />
      </label>

      <div className={styles.field}>
        <span>Населений пункт</span>

        <CityAutocomplete
          value={city}
          valueMode="object"
          onChange={(v) => {
            setCity(v ? toCityAutocompleteValue(v) : null);
            clearErrorOnChange();
          }}
          showLabel={false}
          placeholder="Почніть вводити (місто/село/смт)…"
          inputClassName={styles.textInput}
          dropdownClassName={styles.cityDropdown}
          optionClassName={styles.cityOption}
        />
      </div>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Адреса</span>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearErrorOnChange();
            }}
          />
        </label>

        <label className={styles.field}>
          <span>Ціна (грн/міс)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              clearErrorOnChange();
            }}
          />
        </label>
      </div>

      <div className={styles.row3}>
        <label className={styles.field}>
          <span>Метраж (м²)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              clearErrorOnChange();
            }}
            placeholder="Напр. 42"
          />
        </label>

        <label className={styles.field}>
          <span>Кількість кімнат</span>
          <input
            type="number"
            min="0"
            step="1"
            value={rooms}
            onChange={(e) => {
              setRooms(e.target.value);
              clearErrorOnChange();
            }}
            placeholder="Напр. 2"
          />
        </label>

        <div className={styles.field}>
          <span>Доступно від</span>

          <div className={styles.selectBox} ref={whenWrapRef}>
            <button
              type="button"
              className={styles.selectBtn}
              onClick={() => setWhenOpen((v) => !v)}
              aria-expanded={whenOpen}
            >
              <span className={styles.selectValue}>{whenLabel}</span>
              <span className={styles.selectIcon} aria-hidden="true">
                <CalendarIcon />
              </span>
            </button>

            {whenOpen && (
              <div className={styles.calendarWrap}>
                <CalendarDropdown
                  value={availableFromDate}
                  onChange={(d) => {
                    setAvailableFromDate(d);
                    clearErrorOnChange();
                  }}
                  classNames={calStyles}
                  onClose={() => setWhenOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <label className={styles.field}>
        <span>Опис</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            clearErrorOnChange();
          }}
        />
      </label>

      <div className={styles.field}>
        <span>Фотографії (1–10)</span>

        <input
          className={styles.fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          disabled={isUploadingImages || isSubmitting}
        />

        {localFileNames.length > 0 && (
          <div className={styles.fileNames}>
            {localFileNames.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        )}

        {isUploadingImages && (
          <div className={styles.uploadHint}>Завантажую та стискаю фото…</div>
        )}

        {images.length > 0 && (
          <div className={styles.thumbGrid}>
            {images.map((src, idx) => (
              <div key={`${src}-${idx}`} className={styles.thumbItem}>
                <img className={styles.thumbImg} src={src} alt="" />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  onClick={() => removeImage(idx)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.featuresBlock}>
        <div className={styles.featuresTitle}>Зручності</div>

        <div className={styles.featuresGrid}>
          <Toggle
            label="Окрема кухня"
            value={features.kitchen}
            onChange={(v) => patchFeature("kitchen", v)}
          />
          <Toggle
            label="Є балкон"
            value={features.balcony}
            onChange={(v) => patchFeature("balcony", v)}
          />
          <Toggle
            label="Допускаються тварини"
            value={features.pets}
            onChange={(v) => patchFeature("pets", v)}
          />
          <Toggle
            label="Є ліфт"
            value={features.lift}
            onChange={(v) => patchFeature("lift", v)}
          />
          <Toggle
            label="Парковочне місце"
            value={features.parking}
            onChange={(v) => patchFeature("parking", v)}
          />
          <Toggle
            label="З меблями"
            value={features.furnished}
            onChange={(v) => patchFeature("furnished", v)}
          />
          <Toggle
            label="Комора"
            value={features.storage}
            onChange={(v) => patchFeature("storage", v)}
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={styles.submit}
        disabled={isSubmitting || isUploadingImages}
      >
        {isUploadingImages
          ? "Фото завантажуються…"
          : isSubmitting
            ? "Зберігаю..."
            : isEdit
              ? "Зберегти зміни"
              : "Зберегти оголошення"}
      </button>
    </form>
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
