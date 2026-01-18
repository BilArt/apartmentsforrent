import Button from "../Button/Button.jsx";
import styles from "./Header.module.scss";

import LoginIcon from "../../assets/svg/login.svg?react";
import AddObjectIcon from "../../assets/svg/add_object.svg?react";
import RegisterIcon from "../../assets/svg/registration.svg?react";

export default function Header({
  isAuthed,
  onAddListing,
  onLogout,
  onSignIn,
  onSignUp,
}) {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.inner}>
          <a href="/" className={styles.logo} aria-label="NoReset home">
            <span className={styles.logoAccent}>Nø</span>RESET
          </a>

          <nav className={styles.navigation}>
            <Button
              type="button"
              variant="secondary"
              className={styles.linkBtn}
              leftIcon={AddObjectIcon}
              onClick={onAddListing}
            >
              Додати об’єкт
            </Button>

            {!isAuthed && (
              <Button
                type="button"
                variant="secondary"
                className={styles.linkBtn}
                leftIcon={RegisterIcon}
                onClick={onSignUp}
              >
                Реєстрація
              </Button>
            )}

            {isAuthed ? (
              <Button
                type="button"
                variant="secondary"
                className={styles.linkBtn}
                onClick={onLogout}
              >
                Вийти
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                className={`${styles.linkBtn} ${styles.primaryBtn}`}
                leftIcon={LoginIcon}
                onClick={onSignIn}
              >
                Увійти
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
