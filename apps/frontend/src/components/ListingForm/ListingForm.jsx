import { useEffect, useMemo, useState } from "react";
import styles from "./ListingForm.module.scss";
import CityAutocomplete from "../CityAutocomplete/CityAutocomplete";
import { listingsApi } from "../../api/listings";

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

  const [title, setTitle] = useState(initialTitle);
  const [city, setCity] = useState(initialCity);
  const [address, setAddress] = useState(initialAddress);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(initialPrice);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    setCity(initialCity);
    setAddress(initialAddress);
    setDescription(initialDescription);
    setPrice(initialPrice);
    setError(null);
  }, [
    initialTitle,
    initialCity,
    initialAddress,
    initialDescription,
    initialPrice,
  ]);

  const clearErrorOnChange = () => {
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !city || !address || !description || price === "") {
      setError("Заповніть усі поля, будь-ласка.");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Ціна має бути числом і не менше 0.");
      return;
    }

    const payload = {
      title,
      description,
      address,
      price: priceNumber,
      city: toApiCityPayload(city),
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

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting
          ? "Зберігаю..."
          : isEdit
            ? "Зберегти зміни"
            : "Зберегти оголошення"}
      </button>
    </form>
  );
}
