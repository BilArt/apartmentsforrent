import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import styles from "./UserPublicPage.module.scss";
import { usersApi } from "../../api/users";
import { reviewsApi } from "../../api/reviews";
import { contractsApi } from "../../api/contracts";

function fullName(u) {
  const first = u?.firstName || "";
  const last = u?.lastName || "";
  const s = `${first} ${last}`.trim();
  return s || "—";
}

function fmtDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function pickEligibleContractId(contracts, meId, userId) {
  const me = String(meId || "");
  const other = String(userId || "");
  if (!me || !other) return null;

  const list = Array.isArray(contracts) ? contracts : [];

  const candidates = list
    .filter((c) => {
      if (!c) return false;
      if (c.status !== "COMPLETED") return false;

      const isBetween =
        (String(c.ownerId) === me && String(c.tenantId) === other) ||
        (String(c.ownerId) === other && String(c.tenantId) === me);

      if (!isBetween) return false;

      const reviews = Array.isArray(c.reviews) ? c.reviews : [];
      const already = reviews.some((r) => String(r?.authorId) === me);
      return !already;
    })
    // берём самый свежий (если createdAt есть)
    .sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });

  return candidates.length ? String(candidates[0].id) : null;
}

export default function UserPublicPage({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [reviewsStatus, setReviewsStatus] = useState("idle");
  const [reviewsError, setReviewsError] = useState("");
  const [reviews, setReviews] = useState([]);

  const [canReviewStatus, setCanReviewStatus] = useState("idle");
  const [eligibleContractId, setEligibleContractId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const isMounted = useRef(true);

  const backTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/listings";

  const isSelf = useMemo(() => {
    const me = currentUser?.id ? String(currentUser.id) : null;
    if (!me) return false;
    return me === String(userId);
  }, [currentUser?.id, userId]);

  const name = useMemo(() => fullName(user), [user]);

  const ratingValue = typeof user?.rating === "number" ? user.rating : null;
  const ratingCount =
    typeof user?.ratingCount === "number" ? user.ratingCount : null;

  const refreshUser = async () => {
    const data = await usersApi.getPublicById(userId);
    if (!isMounted.current) return;
    setUser(data);
  };

  const refreshReviews = async () => {
    setReviewsStatus("loading");
    setReviewsError("");

    try {
      const list = await reviewsApi.getForUser(userId);
      if (!isMounted.current) return;
      setReviews(Array.isArray(list) ? list : []);
      setReviewsStatus("ok");
    } catch (e) {
      if (!isMounted.current) return;
      setReviewsStatus("error");
      setReviewsError(e?.message || "Не вдалося завантажити відгуки");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");
        setUser(null);

        const data = await usersApi.getPublicById(userId);
        if (!alive) return;

        setUser(data);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError(e?.message || "Failed to load user");
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (status !== "ok") return;
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);

  useEffect(() => {
    if (!currentUser?.id || isSelf) {
      setEligibleContractId(null);
      setCanReviewStatus("idle");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setCanReviewStatus("loading");

        const myContracts = await contractsApi.getMy();
        if (!alive) return;

        const cid = pickEligibleContractId(myContracts, currentUser.id, userId);
        setEligibleContractId(cid);
        setCanReviewStatus("ok");
      } catch (e) {
        if (!alive) return;

        const msg = e?.message || "";
        if (/not authenticated|unauthorized|401/i.test(String(msg))) {
          setEligibleContractId(null);
          setCanReviewStatus("ok");
          return;
        }

        setEligibleContractId(null);
        setCanReviewStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentUser?.id, isSelf, userId]);

  const canLeaveReview = Boolean(eligibleContractId);

  const reviewButtonTitle =
    canReviewStatus === "loading"
      ? "Перевіряємо угоди…"
      : !canLeaveReview
        ? "Відгук можна залишити лише користувачу, з яким у тебе був COMPLETED контракт, і якщо ти ще не залишав відгук."
        : "";

  const onSubmitReview = async () => {
    if (!eligibleContractId) return;

    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const payload = {
        rating: Number(rating),
        comment: comment.trim() ? comment.trim() : undefined,
      };

      const res = await reviewsApi.createForContract(
        eligibleContractId,
        payload,
      );

      if (res?.ok) {
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rating:
              typeof res.newRating === "number" ? res.newRating : prev.rating,
            ratingCount:
              typeof res.ratingCount === "number"
                ? res.ratingCount
                : prev.ratingCount,
          };
        });
      }

      setFormOpen(false);
      setComment("");
      setRating(5);

      await refreshReviews();
      await refreshUser();

      setEligibleContractId(null);
      setCanReviewStatus("ok");
      setSubmitStatus("ok");
    } catch (e) {
      setSubmitStatus("error");
      setSubmitError(e?.message || "Не вдалося залишити відгук");
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(backTo)}
        >
          ← Назад
        </button>

        {status === "loading" && (
          <div className={styles.state}>Завантаження…</div>
        )}

        {status === "error" && (
          <div className={`${styles.state} ${styles.stateError}`}>
            Помилка: {error}
          </div>
        )}

        {status === "ok" && user && (
          <section className={styles.card}>
            <div className={styles.topRow}>
              <div className={styles.avatar}>{name.slice(0, 1)}</div>

              <div className={styles.head}>
                <div className={styles.name}>{name}</div>
                <div className={styles.sub}>
                  {ratingValue !== null
                    ? `Рейтинг: ${ratingValue}`
                    : "Рейтинг: —"}
                  {ratingCount !== null ? ` • ${ratingCount} відгуків` : ""}
                  {isSelf ? " • це твій профіль" : ""}
                </div>
              </div>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>User ID</div>
                <div className={styles.metaValue}>{user?.id}</div>
              </div>
            </div>

            {!isSelf && (
              <div className={styles.actions}>
                {currentUser?.id ? (
                  <>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => setFormOpen((v) => !v)}
                      disabled={!canLeaveReview || submitStatus === "loading"}
                      title={reviewButtonTitle}
                    >
                      Залишити відгук
                    </button>
                  </>
                ) : (
                  <div className={styles.noteMuted}>
                    Увійди, щоб залишити відгук.
                  </div>
                )}
              </div>
            )}

            {formOpen && (
              <div className={styles.formCard}>
                <div className={styles.formTitle}>Твій відгук</div>

                <div className={styles.formRow}>
                  <div className={styles.formLabel}>Оцінка</div>
                  <select
                    className={styles.select}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 — топ</option>
                    <option value={4}>4</option>
                    <option value={3}>3</option>
                    <option value={2}>2</option>
                    <option value={1}>1 — сумно</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formLabel}>
                    Коментар (необовʼязково)
                  </div>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Коротко й по суті…"
                  />
                </div>

                {submitStatus === "error" && (
                  <div className={styles.formError}>{submitError}</div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setFormOpen(false)}
                    disabled={submitStatus === "loading"}
                  >
                    Скасувати
                  </button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={onSubmitReview}
                    disabled={submitStatus === "loading" || !eligibleContractId}
                  >
                    {submitStatus === "loading"
                      ? "Відправляємо…"
                      : "Опублікувати"}
                  </button>
                </div>

                {!eligibleContractId && (
                  <div className={styles.noteMuted}>
                    Відгук можна залишити лише після завершеної угоди з цим
                    користувачем.
                  </div>
                )}
              </div>
            )}

            <div className={styles.reviewsBlock}>
              <div className={styles.reviewsTitle}>Відгуки</div>

              {reviewsStatus === "loading" && (
                <div className={styles.noteMuted}>Завантажуємо відгуки…</div>
              )}

              {reviewsStatus === "error" && (
                <div className={styles.stateError}>
                  Помилка завантаження відгуків: {reviewsError}
                </div>
              )}

              {reviewsStatus === "ok" && reviews.length === 0 && (
                <div className={styles.noteMuted}>Поки що відгуків немає.</div>
              )}

              {reviewsStatus === "ok" && reviews.length > 0 && (
                <div className={styles.reviewsList}>
                  {reviews.map((r) => {
                    const authorName = fullName(r?.author);
                    return (
                      <div key={r.id} className={styles.reviewCard}>
                        <div className={styles.reviewTop}>
                          <div className={styles.reviewAuthor}>
                            {authorName}
                          </div>
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
                          <div className={styles.noteMuted}>Без коментаря</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
