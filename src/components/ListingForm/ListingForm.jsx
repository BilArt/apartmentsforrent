import { useState } from "react";
import styles from "./ListingForm.module.scss";
import { addListing } from "../../mock/listingsDb";

function ListingForm({ currentUser, onCreated }) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Київ");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !city || !address || !description) {
      setError("Заполни все поля, пожалуйста.");
      return;
    }

    const newListing = addListing({
      title,
      city,
      address,
      description,
      landlordId: currentUser.id,
      landlordName: `${currentUser.firstName} ${currentUser.lastName}`,
      landlordRating: currentUser.rating,
    });

    setError(null);

    if (onCreated) {
      onCreated(newListing);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Название объявления</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Місто</span>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="Київ">Київ</option>
          <option value="Львів">Львів</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Адрес</span>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Опис</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit}>
        Зберегти оголошення
      </button>
    </form>
  );
}

export default ListingForm;
