import { useMemo, useState } from "react";
import Modal from "../Modal/Modal";
import { authApi } from "../../api/auth";
import styles from "./AuthModal.module.scss";

const SEED_OPTIONS = [
  { label: "Орендар (seed)", value: "SEED-BANKID-TENANT-1" },
  { label: "Орендодавець 1 (seed)", value: "SEED-BANKID-1" },
  { label: "Орендодавець 2 (seed)", value: "SEED-BANKID-2" },
  { label: "Орендодавець 3 (seed)", value: "SEED-BANKID-3" },
];

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [bankId, setBankId] = useState(SEED_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => bankId.trim().length > 0, [bankId]);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      const user = await authApi.login({ bankId: bankId.trim() });
      onSuccess?.(user);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося увійти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Увійти" onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          BankID (MVP)
          <select
            className={styles.input}
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            disabled={loading}
          >
            {SEED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.value}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.hint}>
          Можеш також вписати вручну будь-який існуючий <b>bankId</b>.
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={onClose}
            disabled={loading}
          >
            Скасувати
          </button>

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={!canSubmit || loading}
          >
            {loading ? "Входимо…" : "Увійти"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
