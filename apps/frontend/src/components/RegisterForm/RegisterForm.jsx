import { useState } from "react";
import styles from "./RegisterForm.module.scss";
import { authApi } from "../../api/auth";

function RegisterForm({ onRegistered, onGoSignIn, onBankId }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Заповніть ім’я, прізвище та телефон або скористайтесь BankID.");
      return;
    }

    try {
      setError(null);

      // Важно: твой бэк требует bankId, поэтому для “обычной регистрации”
      // мы отправляем мок bankId.
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        bankId: `manual:${phone.trim()}`,
      };

      const user = await authApi.register(payload);
      onRegistered?.(user);
    } catch (err) {
      setError(err.message || "Помилка реєстрації");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
      </label>

      <label className={styles.field}>
        <input
          type="text"
          placeholder="Прізвище"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
      </label>

      <label className={styles.field}>
        <input
          type="tel"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit}>
        Зареєструватися
      </button>

      <button type="button" className={styles.linkMuted} onClick={onGoSignIn}>
        Вже є акаунт? Увійти
      </button>
    </form>
  );
}

export default RegisterForm;
