import { useMemo, useState } from "react";
import Modal from "../Modal/Modal";
import styles from "./AuthModal.module.scss";

import SignInForm from "../SignInForm/SignInForm";
import RegisterForm from "../RegisterForm/RegisterForm";

function safeProvider(v) {
  return v === "privat" ? "privat" : "mono";
}

function safeIntent(v) {
  return v === "signup" ? "signup" : "signin";
}

function buildBankIdStartUrl(provider, returnTo, intent) {
  const base = "";

  const p = safeProvider(provider);
  const rt = encodeURIComponent(returnTo || window.location.href);
  const it = encodeURIComponent(safeIntent(intent));

  return `${base}/auth/bankid/start?provider=${p}&intent=${it}&returnTo=${rt}`;
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode }) {
  const [mode, setMode] = useState(
    initialMode === "signup" ? "signup" : "signin",
  );
  const [provider, setProvider] = useState("mono");

  const title = useMemo(
    () => (mode === "signup" ? "Реєстрація" : "Увійти"),
    [mode],
  );

  if (!isOpen) return null;

  const handleAuthed = (user) => {
    onSuccess?.(user);
    onClose?.();
  };

  const onBankId = () => {
    const returnTo = window.location.href;
    const intent = mode === "signup" ? "signup" : "signin";

    onClose?.();

    window.location.href = buildBankIdStartUrl(provider, returnTo, intent);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.wrap}>
        <div className={styles.topRow}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${
                mode === "signin" ? styles.tabActive : ""
              }`}
              onClick={() => setMode("signin")}
            >
              Увійти
            </button>
            <button
              type="button"
              className={`${styles.tab} ${
                mode === "signup" ? styles.tabActive : ""
              }`}
              onClick={() => setMode("signup")}
            >
              Реєстрація
            </button>
          </div>

          <div className={styles.provider}>
            <button
              type="button"
              className={`${styles.providerBtn} ${
                provider === "mono" ? styles.providerActive : ""
              }`}
              onClick={() => setProvider("mono")}
            >
              mono
            </button>
            <button
              type="button"
              className={`${styles.providerBtn} ${
                provider === "privat" ? styles.providerActive : ""
              }`}
              onClick={() => setProvider("privat")}
            >
              Privat
            </button>
          </div>
        </div>

        {mode === "signin" ? (
          <SignInForm
            onSignedIn={handleAuthed}
            onGoSignUp={() => setMode("signup")}
            onBankId={onBankId}
          />
        ) : (
          <RegisterForm
            onRegistered={handleAuthed}
            onGoSignIn={() => setMode("signin")}
            onBankId={onBankId}
          />
        )}
      </div>
    </Modal>
  );
}
