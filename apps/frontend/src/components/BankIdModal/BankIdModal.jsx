import { useMemo, useState } from "react";
import styles from "./BankIdModal.module.scss";
import { authApi } from "../../api/auth";

function norm(s) {
  return String(s || "").trim();
}

export default function BankIdModal({ mode, onAuthed, onCancel }) {
  const [bank, setBank] = useState("mono");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [bankIdInput, setBankIdInput] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const computedBankId = useMemo(() => {
    const v = norm(bankIdInput);
    if (!v) return "";
    if (!v.includes(":")) return `${bank}:${v}`;
    return v;
  }, [bankIdInput, bank]);

  const canSubmit = useMemo(() => {
    if (loading) return false;

    if (mode === "signin") {
      return Boolean(computedBankId);
    }

    return (
      Boolean(computedBankId) &&
      Boolean(norm(firstName)) &&
      Boolean(norm(lastName)) &&
      Boolean(norm(phone))
    );
  }, [mode, loading, computedBankId, firstName, lastName, phone]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "register") {
        const payload = {
          bankId: computedBankId,
          firstName: norm(firstName),
          lastName: norm(lastName),
          phone: norm(phone),
        };
        const user = await authApi.register(payload);
        onAuthed?.(user);
        return;
      }

      const user = await authApi.login({ bankId: computedBankId });
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
        {mode === "register"
          ? "Підтвердіть особу через BankID (stub для MVP)"
          : "Увійдіть через BankID (stub для MVP)"}
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
          className={`${styles.bankCard} ${bank === "privat" ? styles.active : ""}`}
          onClick={() => setBank("privat")}
          disabled={loading}
        >
          Privat
        </button>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>
          <span>BankID</span>
          <input
            className={styles.input}
            placeholder={
              bank === "mono" ? "mono:123 або 123" : "privat:123 або 123"
            }
            value={bankIdInput}
            onChange={(e) => setBankIdInput(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <div className={styles.hint}>
            Буде використано: <b>{computedBankId || "—"}</b>
          </div>
        </label>

        {mode === "register" && (
          <>
            <label className={styles.label}>
              <span>Імʼя</span>
              <input
                className={styles.input}
                placeholder="Напр. Артем"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                autoComplete="given-name"
              />
            </label>

            <label className={styles.label}>
              <span>Прізвище</span>
              <input
                className={styles.input}
                placeholder="Напр. Білоусов"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                autoComplete="family-name"
              />
            </label>

            <label className={styles.label}>
              <span>Телефон</span>
              <input
                className={styles.input}
                placeholder="+380..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </label>
          </>
        )}
      </div>

      <p className={styles.note}>
        Зараз це MVP-stub: замінимо на реальний redirect/QR-flow пізніше.
      </p>

      {error && <p className={styles.error}>{error}</p>}

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
          disabled={!canSubmit}
        >
          {loading
            ? "Перевіряємо..."
            : mode === "register"
              ? "Зареєструватись"
              : "Увійти"}
        </button>
      </div>
    </div>
  );
}
