import { useMemo, useState } from "react";
import styles from "./BankIdModal.module.scss";

function safeProvider(v) {
  return v === "privat" ? "privat" : "mono";
}

function modeToIntent(mode) {
  return mode === "register" ? "signup" : "signin";
}

function buildStartUrl(provider, returnTo, intent) {
  const base = "";

  const p = safeProvider(provider);
  const rt = encodeURIComponent(returnTo || window.location.href);
  const it = encodeURIComponent(intent);

  return `${base}/auth/bankid/start?provider=${p}&intent=${it}&returnTo=${rt}`;
}

export default function BankIdModal({ mode = "signin", onCancel }) {
  const [provider, setProvider] = useState("mono");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const title = useMemo(() => {
    return mode === "register"
      ? "Підтвердіть особу через BankID"
      : "Увійдіть через BankID";
  }, [mode]);

  const subtitle = useMemo(() => {
    return "Ви будете перенаправлені до банку для підтвердження особи.";
  }, []);

  const handleContinue = () => {
    try {
      setLoading(true);
      setError(null);

      const returnTo = window.location.href;
      const intent = modeToIntent(mode);

      onCancel?.();

      window.location.href = buildStartUrl(provider, returnTo, intent);
    } catch (e) {
      setLoading(false);
      setError(e?.message || "Не вдалося запустити BankID");
    }
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{title}</p>
      <p className={styles.note}>{subtitle}</p>

      <div className={styles.banks}>
        <button
          type="button"
          className={`${styles.bankCard} ${
            provider === "mono" ? styles.active : ""
          }`}
          onClick={() => setProvider("mono")}
          disabled={loading}
        >
          mono
        </button>

        <button
          type="button"
          className={`${styles.bankCard} ${
            provider === "privat" ? styles.active : ""
          }`}
          onClick={() => setProvider("privat")}
          disabled={loading}
        >
          Privat
        </button>
      </div>

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
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? "Перенаправляємо..." : "Продовжити"}
        </button>
      </div>
    </div>
  );
}
