import { useState } from "react";
import styles from "./RegisterForm.module.scss";
import { addUser } from "../../mock/userDb";

function RegisterForm({ onRegistered }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankId, setBankId] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !phone || !bankId) {
      setError("Заповніть всі поля, будь-ласка.");
      return;
    }

    const newUser = addUser({ firstName, lastName, phone, bankId });

    setError(null);
    if (onRegistered) {
      onRegistered(newUser);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Ім'я</span>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Прізвище</span>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Телефон</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>BankID (мок)</span>
        <input
          type="text"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit}>
        Зареєструватися
      </button>
    </form>
  );
}

export default RegisterForm;
