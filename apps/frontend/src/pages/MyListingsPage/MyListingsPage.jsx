import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MyListingsPage.module.scss";
import { listingsApi } from "../../api/listings";

export default function MyListingsPage({
  currentUser,
  authLoading,
  onRequireAuth,
}) {
  const navigate = useNavigate();

  const isAuthed = !authLoading && Boolean(currentUser);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const data = await listingsApi.getMy();
      setItems(Array.isArray(data) ? data : []);
      setStatus("ok");
    } catch (e) {
      const msg = e?.message || "Не вдалося завантажити оголошення";
      if (/not authenticated|unauthorized|401/i.test(String(msg))) {
        setError("Схоже, твоя сесія закінчилась. Увійди ще раз.");
      } else {
        setError(msg);
      }
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) return;

    let alive = true;

    (async () => {
      setStatus("loading");
      setError("");

      try {
        const data = await listingsApi.getMy();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        const msg = e?.message || "Не вдалося завантажити оголошення";
        if (/not authenticated|unauthorized|401/i.test(String(msg))) {
          setError("Схоже, твоя сесія закінчилась. Увійди ще раз.");
        } else {
          setError(msg);
        }
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [authLoading, isAuthed]);

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.shell}>
            <div className={styles.state}>Перевіряємо сесію…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.shell}>
            <div className={styles.state}>
              <div className={styles.stateTitle}>Потрібна авторизація</div>
              <div className={styles.stateText}>
                Увійди, щоб переглядати свої оголошення.
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>Мої оголошення</h1>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={load}
            disabled={status === "loading"}
            title="Оновити список"
          >
            Оновити
          </button>
        </div>

        <div className={styles.shell}>
          {status === "loading" && (
            <div className={styles.state}>Завантаження…</div>
          )}

          {status === "error" && (
            <div className={`${styles.state} ${styles.stateError}`}>
              <div className={styles.stateTitle}>Помилка</div>
              <div className={styles.stateText}>{error}</div>

              <div className={styles.stateActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={load}
                >
                  Спробувати ще раз
                </button>

                {/сесія.*закінчилась/i.test(error) ? (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => onRequireAuth?.()}
                  >
                    Увійти
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {status === "ok" && items.length === 0 && (
            <div className={styles.state}>
              <div className={styles.stateTitle}>Поки що порожньо</div>
              <div className={styles.stateText}>
                Ти ще не створював оголошення. Натисни “Додати об’єкт” у хедері.
              </div>
            </div>
          )}

          {status === "ok" && items.length > 0 && (
            <div className={styles.list}>
              {items.map((l) => (
                <article key={l.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardLeft}>
                      <div className={styles.title}>
                        {l?.title || "Оголошення"}
                      </div>
                      <div className={styles.sub}>
                        {(l?.city?.nameUk || l?.city?.name || "—").toString()}
                        {l?.address ? ` • ${l.address}` : ""}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.primarySolidBtn}
                      onClick={() => navigate(`/listings/${l.id}`)}
                      disabled={!l?.id}
                    >
                      Відкрити
                    </button>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primarySolidBtn}
                      onClick={() =>
                        navigate(
                          `/requests?tab=incoming&listingId=${encodeURIComponent(
                            String(l.id)
                          )}`
                        )
                      }
                      disabled={!l?.id}
                      title="Показати вхідні заявки для цього оголошення"
                    >
                      Вхідні заявки
                    </button>

                    <button
                      type="button"
                      className={styles.ghostBtn}
                      disabled
                      title="Скоро"
                    >
                      Редагувати
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
