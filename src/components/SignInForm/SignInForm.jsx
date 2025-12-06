import { useState } from "react";
import styles from "./SignInForm.module.scss";
import { findUserByBankId } from "../../mock/userDb";

function SignInForm({ onSignedIn }) {
  const [bankId, setBankId] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bankId) {
      setError("Ведіть BankID, будь-ласка.");
      return;
    }

    const user = findUserByBankId(bankId);

    if (!user) {
      setError("Користувач з таким BankID не знайден.");
      return;
    }

    setError(null);
    if (onSignedIn) {
      onSignedIn(user);
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
        Войти
      </button>
    </form>
  );
}

export default SignInForm;
