import { useState } from "react";
import styles from "./BankIdModal.module.scss";
import { authApi } from "../../api/auth";

export default function BankIdModal({ mode, onAuthed, onCancel }) {
  const [bank, setBank] = useState("mono");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      // мок “данных от банка”
      const mockProfile = {
        firstName: "Test",
        lastName: "User",
        phone: "+380000000000",
        bankId: `${bank}:123`,
      };

      const user =
        mode === "register"
          ? await authApi.register(mockProfile)
          : await authApi.login({ bankId: mockProfile.bankId });

      onAuthed?.(user);
    } catch (e) {
      setError(e.message || "Помилка BankID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>
        Підтвердіть свою особу за допомогою BankID одного з банків:
      </p>

      <div className={styles.banks}>
        <button
          type="button"
          className={`${styles.bankCard} ${bank === "mono" ? styles.active : ""}`}
          onClick={() => setBank("mono")}
        >
          mono
        </button>

        <button
          type="button"
          className={`${styles.bankCard} ${bank === "privat" ? styles.active : ""}`}
          onClick={() => setBank("privat")}
        >
          Privat
        </button>
      </div>

      <p className={styles.note}>
        Профілі з підтвердженням через банк отримують особливу позначку та
        викликають більше довіри у користувачів.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Скасувати
        </button>
        <button
          type="button"
          className={styles.confirm}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Перевіряємо..." : "Підтвердити"}
        </button>
      </div>
    </div>
  );
}
