import { useState } from "react";
import styles from "./SignInForm.module.scss";
import { authApi } from "../../api/auth";

function SignInForm({ onSignedIn }) {
  const [bankId, setBankId] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankId) {
      setError("Ведіть BankID, будь-ласка.");
      return;
    }

    try {
      setError(null);

      const user = await authApi.login({ bankId });

      onSignedIn?.(user);
    } catch (err) {
      setError(err.message || "Користувач з таким BankID не знайден.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>BankID (мок)</span>
        <input
          type="text"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit}>
        Увійти
      </button>
    </form>
  );
}

export default SignInForm;
