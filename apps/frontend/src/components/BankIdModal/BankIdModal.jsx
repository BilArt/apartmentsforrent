import { useMemo, useState } from "react";
import styles from "./BankIdModal.module.scss";
import { authApi } from "../../api/auth";

export default function BankIdModal({ mode, onAuthed, onCancel }) {
  const [bank, setBank] = useState("mono");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDev = import.meta.env.DEV;

  const DEV_TENANTS = useMemo(() => ["SEED-BANKID-TENANT-1"], []);
  const DEV_OWNERS = useMemo(
    () => ["SEED-BANKID-1", "SEED-BANKID-2", "SEED-BANKID-3"],
    []
  );

  const handleDevLogin = async (bankId) => {
    try {
      setLoading(true);
      setError(null);

      const user = await authApi.login({ bankId });
      onAuthed?.(user);
    } catch (e) {
      setError(e?.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError(e?.message || "Помилка BankID");
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

      {isDev && (
        <div className={styles.devBlock}>
          <div className={styles.devTitle}>Dev швидкий вхід</div>

          <div className={styles.devGroup}>
            <div className={styles.devLabel}>Орендар</div>
            <div className={styles.devGrid}>
              {DEV_TENANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.devBtn}
                  onClick={() => handleDevLogin(id)}
                  disabled={loading}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.devGroup}>
            <div className={styles.devLabel}>Орендодавець</div>
            <div className={styles.devGrid}>
              {DEV_OWNERS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.devBtn}
                  onClick={() => handleDevLogin(id)}
                  disabled={loading}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.devHint}>
            (Це видно тільки в dev-режимі)
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={loading}>
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
