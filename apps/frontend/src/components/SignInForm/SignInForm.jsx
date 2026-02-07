import { useMemo, useState } from "react";
import styles from "./SignInForm.module.scss";
import { authApi } from "../../api/auth";

const UA_PREFIX = "+380";
const UA_PREFIX_DIGITS = "380";
const UA_LOCAL_LEN = 9;
const UA_FULL_DIGITS_LEN = UA_PREFIX_DIGITS.length + UA_LOCAL_LEN; // 12
const UA_MAX_LEN = 1 + UA_FULL_DIGITS_LEN; // 13
const UA_PHONE_RE = /^\+380\d{9}$/;

function digitsOnly(v) {
  return String(v || "").replace(/\D+/g, "");
}

function normalizeUaPhone(value) {
  const d = digitsOnly(value);

  if (!d) return UA_PREFIX;

  if (d.startsWith("0") && d.length === 10) {
    const local = d.slice(1);
    return "+380" + local.slice(0, UA_LOCAL_LEN);
  }

  if (d.startsWith("380")) {
    const rest = d.slice(3);
    return "+380" + rest.slice(0, UA_LOCAL_LEN);
  }

  if (d.length === 9) {
    return "+380" + d;
  }

  if (d.length > UA_LOCAL_LEN) {
    const tail = d.slice(-UA_LOCAL_LEN);
    return "+380" + tail;
  }

  return "+380" + d.slice(0, UA_LOCAL_LEN);
}

function sanitizeUaPhoneInput(raw) {
  const cleaned = String(raw || "").replace(/[^\d+]/g, "");
  let digits = digitsOnly(cleaned);

  if (!digits) return UA_PREFIX;

  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith(UA_PREFIX_DIGITS)) digits = digits.slice(3);

  const local = digits.slice(0, UA_LOCAL_LEN);
  return UA_PREFIX + local;
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

      <label className={styles.field}>
        <input
          type="tel"
          placeholder="+380XXXXXXXXX"
          value={phone}
          onChange={(e) => {
            setPhone(sanitizeUaPhoneInput(e.target.value));
            setError(null);
          }}
          onBlur={() => {
            const normalized = normalizeUaPhone(phone);
            setPhone(normalized || UA_PREFIX);
          }}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={UA_MAX_LEN}
        />
      </label>

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
