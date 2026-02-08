import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.scss";
import { reviewsApi } from "../../api/reviews";

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

function fmtDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
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

  const ratingCount =
    typeof currentUser?.ratingCount === "number"
      ? currentUser.ratingCount
      : null;

  const bankId = maskBankId(currentUser?.bankId);
  const isVerified = Boolean(currentUser?.bankIdVerified);

  const requestsLink =
    role === "Орендодавець" ? "/requests?tab=incoming" : "/requests?tab=my";

  const [reviewsStatus, setReviewsStatus] = useState("idle");
  const [reviewsError, setReviewsError] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!isAuthed || !currentUser?.id) return;

    let alive = true;

    (async () => {
      setReviewsStatus("loading");
      setReviewsError("");

      try {
        const list = await reviewsApi.getForUser(currentUser.id);
        if (!alive) return;
        setReviews(Array.isArray(list) ? list : []);
        setReviewsStatus("ok");
      } catch (e) {
        if (!alive) return;
        setReviewsStatus("error");
        setReviewsError(e?.message || "Не вдалося завантажити відгуки");
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthed, currentUser?.id]);

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
                    <div className={styles.nameRow}>
                      <div className={styles.name}>{name}</div>
                      {isVerified && (
                        <div
                          className={styles.verifiedBadge}
                          title="Профіль підтверджений через BankID"
                        >
                          BankID ✓
                        </div>
                      )}
                    </div>

                    <div className={styles.sub}>
                      {role}
                      {rating !== null ? ` • ${rating}` : ""}
                      {ratingCount !== null ? ` • ${ratingCount} відгуків` : ""}
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

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => onLogout?.()}
                    title="Вийти з акаунта"
                  >
                    Вийти
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
                  <div className={styles.metaLabel}>Підтвердження</div>
                  <div className={styles.metaValue}>
                    {isVerified ? "BankID verified" : "—"}
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>User ID</div>
                  <div className={styles.metaValue}>{currentUser?.id}</div>
                </div>
              </div>

              {/* НОВОЕ: отзывы в профиле */}
              <div className={styles.reviewsBlock}>
                <div className={styles.reviewsTitle}>Відгуки про тебе</div>

                {reviewsStatus === "loading" && (
                  <div className={styles.noteMuted}>Завантажуємо…</div>
                )}

                {reviewsStatus === "error" && (
                  <div className={styles.stateError}>
                    Помилка: {reviewsError}
                  </div>
                )}

                {reviewsStatus === "ok" && reviews.length === 0 && (
                  <div className={styles.noteMuted}>
                    Поки що відгуків немає.
                  </div>
                )}

                {reviewsStatus === "ok" && reviews.length > 0 && (
                  <div className={styles.reviewsList}>
                    {reviews.slice(0, 5).map((r) => {
                      const author = fullName(r?.author);
                      return (
                        <div key={r.id} className={styles.reviewCard}>
                          <div className={styles.reviewTop}>
                            <div className={styles.reviewAuthor}>{author}</div>
                            <div className={styles.reviewMeta}>
                              <span className={styles.reviewRating}>
                                {r.rating}/5
                              </span>
                              <span className={styles.dot}>•</span>
                              <span className={styles.reviewDate}>
                                {fmtDate(r.createdAt)}
                              </span>
                            </div>
                          </div>

                          {r.comment ? (
                            <div className={styles.reviewText}>{r.comment}</div>
                          ) : (
                            <div className={styles.noteMuted}>
                              Без коментаря
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {reviews.length > 5 ? (
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() =>
                          navigate(
                            `/users/${encodeURIComponent(String(currentUser.id))}`,
                          )
                        }
                        title="Відкрити публічний профіль з усіма відгуками"
                      >
                        Показати всі
                      </button>
                    ) : null}
                  </div>
                )}
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
