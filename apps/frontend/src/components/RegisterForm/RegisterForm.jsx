import { useMemo, useState } from "react";
import styles from "./RegisterForm.module.scss";
import { authApi } from "../../api/auth";

const UA_PREFIX = "+380";
const UA_PREFIX_DIGITS = "380";
const UA_LOCAL_LEN = 9;
const UA_FULL_DIGITS_LEN = UA_PREFIX_DIGITS.length + UA_LOCAL_LEN;
const UA_MAX_LEN = 1 + UA_FULL_DIGITS_LEN;

const NAME_ALLOWED_RE = /^[\p{L}]+(?:[ '\-’][\p{L}]+)*$/u;

function normalizeName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function digitsOnly(value) {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeUaPhone(input) {
  const d = digitsOnly(input);

  if (!d) return UA_PREFIX;

  if (d.startsWith("0") && d.length === 10) {
    const local = d.slice(1);
    return UA_PREFIX + local.slice(0, UA_LOCAL_LEN);
  }

  if (d.startsWith(UA_PREFIX_DIGITS)) {
    const rest = d.slice(UA_PREFIX_DIGITS.length);
    return UA_PREFIX + rest.slice(0, UA_LOCAL_LEN);
  }

  if (d.length === UA_LOCAL_LEN) {
    return UA_PREFIX + d;
  }

  if (d.length > UA_LOCAL_LEN) {
    const tail = d.slice(-UA_LOCAL_LEN);
    return UA_PREFIX + tail;
  }

  return UA_PREFIX + d.slice(0, UA_LOCAL_LEN);
}

function sanitizeUaPhoneInput(raw) {
  const cleaned = String(raw || "").replace(/[^\d+]/g, "");

  let digits = digitsOnly(cleaned);

  if (!digits) return UA_PREFIX;

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.startsWith(UA_PREFIX_DIGITS)) {
    digits = digits.slice(UA_PREFIX_DIGITS.length);
  }

  const local = digits.slice(0, UA_LOCAL_LEN);

  return UA_PREFIX + local;
}

function isValidUaPhone(normalized) {
  return /^\+380\d{9}$/.test(normalized);
}

function validate({ firstName, lastName, phoneNormalized, password }) {
  const errors = {};

  const fn = normalizeName(firstName);
  const ln = normalizeName(lastName);

  if (!fn) errors.firstName = "Вкажіть ім’я.";
  else if (!NAME_ALLOWED_RE.test(fn))
    errors.firstName = "Ім’я: лише літери (можна пробіл/дефіс/апостроф).";
  else if (fn.length < 2) errors.firstName = "Ім’я занадто коротке.";

  if (!ln) errors.lastName = "Вкажіть прізвище.";
  else if (!NAME_ALLOWED_RE.test(ln))
    errors.lastName = "Прізвище: лише літери (можна пробіл/дефіс/апостроф).";
  else if (ln.length < 2) errors.lastName = "Прізвище занадто коротке.";

  if (!phoneNormalized || phoneNormalized === UA_PREFIX)
    errors.phone = "Вкажіть телефон.";
  else if (!isValidUaPhone(phoneNormalized))
    errors.phone = "Телефон має бути у форматі +380XXXXXXXXX (Україна).";

  if (!password) errors.password = "Вкажіть пароль.";
  else if (password.length < 4)
    errors.password = "Пароль має бути мінімум 4 символи.";

  return errors;
}

function RegisterForm({ onRegistered, onGoSignIn, onBankId }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(UA_PREFIX);
  const [password, setPassword] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const phoneNormalized = useMemo(() => normalizeUaPhone(phone), [phone]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return (
      NAME_ALLOWED_RE.test(normalizeName(firstName)) &&
      NAME_ALLOWED_RE.test(normalizeName(lastName)) &&
      isValidUaPhone(phoneNormalized) &&
      password.length >= 4
    );
  }, [submitting, firstName, lastName, phoneNormalized, password]);

  const onFirstNameChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[0-9]/g, "");
    setFirstName(cleaned);
    setFormErrors((p) => ({ ...p, firstName: undefined }));
    setError(null);
  };

  const onLastNameChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[0-9]/g, "");
    setLastName(cleaned);
    setFormErrors((p) => ({ ...p, lastName: undefined }));
    setError(null);
  };

  const onPhoneChange = (e) => {
    const next = sanitizeUaPhoneInput(e.target.value);
    setPhone(next);

    setFormErrors((p) => ({ ...p, phone: undefined }));
    setError(null);
  };

  const handlePhoneBlur = () => {
    const normalized = normalizeUaPhone(phone);
    setPhone(normalized || UA_PREFIX);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedFirst = normalizeName(firstName);
    const trimmedLast = normalizeName(lastName);
    const normalizedPhone = normalizeUaPhone(phone);

    const errors = validate({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phoneNormalized: normalizedPhone,
      password,
    });

    setFormErrors(errors);

    if (Object.keys(errors).length) {
      setError("Перевірте поля форми.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: normalizedPhone,
        bankId: `manual:${normalizedPhone}`,
        password,
      };

      const user = await authApi.register(payload);
      onRegistered?.(user);
    } catch (err) {
      setError(err?.message || "Помилка реєстрації");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.tip}>
        <strong>Найкраще — через BankID</strong>
        <p>
          Це швидше та надійніше. Профіль отримає позначку підтвердження —
          більше довіри від користувачів.
        </p>
      </div>

      <button type="button" className={styles.bankIdBtn} onClick={onBankId}>
        Продовжити з BankID
      </button>

      <div className={styles.divider}>
        <span>або</span>
      </div>

      <label className={styles.field}>
        <input
          type="text"
          placeholder="Ім’я"
          value={firstName}
          onChange={onFirstNameChange}
          onBlur={() => {
            const v = normalizeName(firstName);
            setFirstName(v);
            const fe = validate({
              firstName: v,
              lastName,
              phoneNormalized,
              password,
            });
            setFormErrors((p) => ({ ...p, firstName: fe.firstName }));
          }}
          autoComplete="given-name"
          inputMode="text"
          aria-invalid={!!formErrors.firstName}
        />
        {formErrors.firstName && (
          <span className={styles.fieldError}>{formErrors.firstName}</span>
        )}
      </label>

      <label className={styles.field}>
        <input
          type="text"
          placeholder="Прізвище"
          value={lastName}
          onChange={onLastNameChange}
          onBlur={() => {
            const v = normalizeName(lastName);
            setLastName(v);
            const fe = validate({
              firstName,
              lastName: v,
              phoneNormalized,
              password,
            });
            setFormErrors((p) => ({ ...p, lastName: fe.lastName }));
          }}
          autoComplete="family-name"
          inputMode="text"
          aria-invalid={!!formErrors.lastName}
        />
        {formErrors.lastName && (
          <span className={styles.fieldError}>{formErrors.lastName}</span>
        )}
      </label>

      <label className={styles.field}>
        <input
          type="tel"
          placeholder="+380XXXXXXXXX"
          value={phone}
          onChange={onPhoneChange}
          onBlur={handlePhoneBlur}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={UA_MAX_LEN}
          aria-invalid={!!formErrors.phone}
        />
        {formErrors.phone && (
          <span className={styles.fieldError}>{formErrors.phone}</span>
        )}
      </label>

      <label className={styles.field}>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFormErrors((p) => ({ ...p, password: undefined }));
            setError(null);
          }}
          onBlur={() => {
            const fe = validate({
              firstName,
              lastName,
              phoneNormalized,
              password,
            });
            setFormErrors((p) => ({ ...p, password: fe.password }));
          }}
          autoComplete="new-password"
          aria-invalid={!!formErrors.password}
        />
        {formErrors.password && (
          <span className={styles.fieldError}>{formErrors.password}</span>
        )}
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={styles.submit}
        disabled={!canSubmit}
        aria-busy={submitting}
      >
        {submitting ? "Реєструю..." : "Зареєструватися"}
      </button>

      <button type="button" className={styles.linkMuted} onClick={onGoSignIn}>
        Вже є акаунт? Увійти
      </button>
    </form>
  );
}

export default RegisterForm;
