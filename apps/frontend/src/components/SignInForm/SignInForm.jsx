import { useState } from "react";
import styles from "./SignInForm.module.scss";
import { authApi } from "../../api/auth";

function SignInForm({ onSignedIn, onGoSignUp, onBankId }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Введіть e-mail і пароль або увійдіть через BankID.");
      return;
    }

    try {
      setError(null);
      const user = await authApi.login({ email: email.trim(), password });
      onSignedIn?.(user);
    } catch (err) {
      setError(err.message || "Помилка входу");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>

      <label className={styles.field}>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit}>
        Увійти
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
