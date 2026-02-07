import { useMemo, useState } from "react";
import styles from "./SignInForm.module.scss";
import { authApi } from "../../api/auth";

const UA_PREFIX = "+380";
const UA_PHONE_RE = /^\+380\d{9}$/;

function digitsOnly(v) {
  return String(v || "").replace(/\D+/g, "");
}

function normalizeUaPhone(value) {
  const d = digitsOnly(value);

  if (!d) return UA_PREFIX;

  if (d.startsWith("0") && d.length === 10) {
    return "+380" + d.slice(1);
  }

  if (d.startsWith("380")) {
    return "+380" + d.slice(3);
  }

  if (d.length === 9) {
    return "+380" + d;
  }

  return "+" + d;
}

function SignInForm({ onSignedIn, onGoSignUp, onBankId }) {
  const [phone, setPhone] = useState(UA_PREFIX);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedPhone = useMemo(() => normalizeUaPhone(phone), [phone]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return UA_PHONE_RE.test(normalizedPhone) && password.length >= 4;
  }, [submitting, normalizedPhone, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ph = normalizeUaPhone(phone);

    if (!UA_PHONE_RE.test(ph) || !password) {
      setError(
        "Введіть телефон (+380XXXXXXXXX) і пароль або скористайтесь BankID.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const user = await authApi.login({
        phone: ph,
        password,
      });

      onSignedIn?.(user);
    } catch (err) {
      setError(err?.message || "Невірний телефон або пароль");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.tip}>
        <strong>Рекомендуємо BankID</strong>
        <p>Це швидше й безпечніше: без паролів, менше помилок.</p>
      </div>

      <button type="button" className={styles.bankIdBtn} onClick={onBankId}>
        Продовжити з BankID
      </button>

      <div className={styles.divider}>
        <span>або</span>
      </div>

      {/* Телефон */}
      <label className={styles.field}>
        <input
          type="tel"
          placeholder="+380XXXXXXXXX"
          value={phone}
          onChange={(e) => {
            const raw = e.target.value;
            const safe = raw.replace(/[^\d+()\-\s]/g, "");

            if (!safe.startsWith(UA_PREFIX)) {
              const normalized = normalizeUaPhone(safe);
              setPhone(normalized || UA_PREFIX);
            } else {
              setPhone(safe);
            }

            setError(null);
          }}
          onBlur={() => {
            const normalized = normalizeUaPhone(phone);
            setPhone(normalized || UA_PREFIX);
          }}
          autoComplete="tel"
          inputMode="numeric"
        />
      </label>

      {/* Пароль */}
      <label className={styles.field}>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          autoComplete="current-password"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={!canSubmit}>
        {submitting ? "Входимо..." : "Увійти"}
      </button>

      <button type="button" className={styles.linkMuted}>
        Не пам’ятаю пароль
      </button>

      <button type="button" className={styles.linkAccent} onClick={onGoSignUp}>
        Зареєструватись
      </button>
    </form>
  );
}

export default SignInForm;
