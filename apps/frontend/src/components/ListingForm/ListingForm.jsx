import { useState } from "react";
import styles from "./ListingForm.module.scss";
import CityAutocomplete from "../CityAutocomplete/CityAutocomplete";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ListingForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          address,
          price: priceNumber,
          city: {
            geonameId: Number(city.id),
            name: city.name,
            nameUk: city.nameUk,
            admin1: city.admin1,
            admin2: city.admin2,
            lat: Number(city.lat),
            lon: Number(city.lon),
          },
        }),
      });

      if (res.status === 401) {
        throw new Error("Ви не авторизовані. Зайдіть в обліковий запис і спробуйте знову.");
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || "Failed to create listing";
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
      }

      onCreated?.(data);

      setTitle("");
      setCity(null);
      setAddress("");
      setDescription("");
      setPrice("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
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
            if (error) setError(null);
          }}
        />
      </label>

      <CityAutocomplete
        value={city}
        onChange={(v) => {
          setCity(v);
          if (error) setError(null);
        }}
        label="Населений пункт"
      />

      <label className={styles.field}>
        <span>Адреса</span>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError(null);
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
            if (error) setError(null);
          }}
        />
      </label>

      <label className={styles.field}>
        <span>Опис</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError(null);
          }}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Зберігаю..." : "Зберегти оголошення"}
      </button>
    </form>
  );
}

export default ListingForm;
