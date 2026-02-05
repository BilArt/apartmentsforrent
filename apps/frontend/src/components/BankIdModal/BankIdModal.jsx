import { useState } from "react";
import styles from "./BankIdModal.module.scss";
import { authApi } from "../../api/auth";
import { API_BASE_URL } from "../../api/config";

export default function BankIdModal({ mode, onAuthed, onCancel }) {
  const [bank, setBank] = useState("mono");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const startUrl = `${API_BASE_URL}/auth/bankid/start?bank=${encodeURIComponent(
        bank,
      )}&mode=${encodeURIComponent(mode || "signin")}`;

      window.location.href = startUrl;
    } catch (e) {
      setError(e?.message || "Помилка BankID");
      setLoading(false);
    }
  };

  const handleCheckSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authApi.me();
      onAuthed?.(user);
    } catch (e) {
      setError(
        e?.message ||
          "Не вдалося підтвердити сесію. Спробуй ще раз або увійди іншим способом.",
      );
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
          disabled={loading}
        >
          mono
        </button>

        <button
          type="button"
          className={`${styles.bankCard} ${
            bank === "privat" ? styles.active : ""
          }`}
          onClick={() => setBank("privat")}
          disabled={loading}
        >
          Privat
        </button>
      </div>

      <p className={styles.note}>
        Профілі з підтвердженням через банк отримують особливу позначку та
        викликають більше довіри у користувачів.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="button"
        className={styles.linkBtn}
        onClick={handleCheckSession}
        disabled={loading}
        title="Якщо ти вже підтвердив у банку і повернувся назад"
      >
        Я підтвердив
      </button>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={loading}
        >
          Скасувати
        </button>

        <button
          type="button"
          className={styles.confirm}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Переходимо..." : "Підтвердити"}
        </button>
      </div>
    </div>
  );
}
