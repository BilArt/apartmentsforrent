import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "../Button/Button.jsx";
import styles from "./Header.module.scss";

import LoginIcon from "../../assets/svg/login.svg?react";
import AddObjectIcon from "../../assets/svg/add_object.svg?react";
import RegisterIcon from "../../assets/svg/registration.svg?react";
import ProfileIcon from "../../assets/svg/profile.svg?react";

export default function Header({
  isAuthed,
  currentUser,
  onAddListing,
  onLogout,
  onSignIn,
  onSignUp,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((v) => !v);

  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path) => {
    closeMenu();
    navigate(path);
  };

  const userFullName = useMemo(() => {
    if (!currentUser) return "Профіль";
    const first = currentUser.firstName || "";
    const last = currentUser.lastName || "";
    return `${first} ${last}`.trim() || "Профіль";
  }, [currentUser]);

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} aria-label="NoReset home">
            <span className={styles.logoAccent}>Nø</span>RESET
          </Link>

          {!isAuthed ? (
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

              <Button
                type="button"
                variant="secondary"
                className={styles.linkBtn}
                leftIcon={RegisterIcon}
                onClick={onSignUp}
              >
                Реєстрація
              </Button>

              <Button
                type="button"
                variant="primary"
                className={`${styles.linkBtn} ${styles.primaryBtn}`}
                leftIcon={LoginIcon}
                onClick={onSignIn}
              >
                Увійти
              </Button>
            </nav>
          ) : (
            <nav className={styles.authedNav}>
              <div className={styles.userMenuWrap} ref={menuRef}>
                <button
                  type="button"
                  className={styles.userChip}
                  onClick={toggleMenu}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className={styles.userIcon} aria-hidden="true">
                    <ProfileIcon />
                  </span>
                  <span className={styles.userName}>{userFullName}</span>
                </button>

                {menuOpen && (
                  <div className={styles.menu} role="menu">
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => go("/profile")}
                      role="menuitem"
                    >
                      Мій профіль
                    </button>

                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => go("/requests")}
                      role="menuitem"
                    >
                      Заявки
                    </button>

                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => {
                        closeMenu();
                        onAddListing?.();
                      }}
                      role="menuitem"
                    >
                      Додати об’єкт
                    </button>

                    <div className={styles.menuDivider} />

                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      onClick={() => {
                        closeMenu();
                        onLogout?.();
                      }}
                      role="menuitem"
                    >
                      Вийти
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
