import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.scss";

function detectRole(user) {
  const id = String(user?.id || "").toLowerCase();
  if (id.includes("owner")) return "Орендодавець";
  if (id.includes("tenant")) return "Орендар";
  return "Користувач";
}

function fullName(user) {
  const first = user?.firstName || "";
  const last = user?.lastName || "";
  const s = `${first} ${last}`.trim();
  return s || "—";
}

function maskBankId(bankId) {
  const s = String(bankId || "");
  if (!s) return "—";
  if (s.length <= 6) return s;
  return `${s.slice(0, 4)}…${s.slice(-2)}`;
}

export default function ProfilePage({
  currentUser,
  authLoading,
  onRequireAuth,
  onLogout,
}) {
  const navigate = useNavigate();

  const isAuthed = !authLoading && Boolean(currentUser);

  const role = useMemo(() => detectRole(currentUser), [currentUser]);
  const name = useMemo(() => fullName(currentUser), [currentUser]);
  const phone = currentUser?.phone || "—";
  const rating =
    typeof currentUser?.rating === "number" ? currentUser.rating : null;
  const bankId = maskBankId(currentUser?.bankId);

  const requestsLink =
    role === "Орендодавець" ? "/requests?tab=incoming" : "/requests?tab=my";

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>Профіль</h1>
        </div>

        <div className={styles.shell}>
          {authLoading && <div className={styles.state}>Завантаження…</div>}

          {!authLoading && !isAuthed && (
            <div className={styles.state}>
              <div className={styles.stateTitle}>Потрібна авторизація</div>
              <div className={styles.stateText}>
                Увійди, щоб переглядати профіль.
              </div>

              <div className={styles.stateActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => onRequireAuth?.()}
                >
                  Увійти
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => navigate("/")}
                >
                  На головну
                </button>
              </div>
            </div>
          )}

          {!authLoading && isAuthed && (
            <section className={styles.profileCard}>
              <div className={styles.topRow}>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>{name.slice(0, 1)}</div>
                  <div>
                    <div className={styles.name}>{name}</div>
                    <div className={styles.sub}>
                      {role}
                      {rating !== null ? ` • ⭐ ${rating}` : ""}
                    </div>
                  </div>
                </div>

                <div className={styles.quickActions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => navigate(requestsLink)}
                  >
                    Перейти до заявок
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => navigate("/listings")}
                  >
                    Перейти до оголошень
                  </button>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>Телефон</div>
                  <div className={styles.metaValue}>{phone}</div>
                </div>

                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>BankID</div>
                  <div className={styles.metaValue}>{bankId}</div>
                </div>

                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>User ID</div>
                  <div className={styles.metaValue}>{currentUser?.id}</div>
                </div>
              </div>

              <div className={styles.footerNote}>
                Далі тут з’являться “Мої оголошення”, “Обране”, “Налаштування”.
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
