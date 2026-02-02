import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./FavoritesPage.module.scss";
import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import { listingsApi } from "../../api/listings";

function normalizeListing(x) {
  return { ...x };
}

export default function FavoritesPage({
  canFavorite = false,
  favoriteSet = new Set(),
  onToggleFavorite,
} = {}) {
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        if (!canFavorite) {
          setItems([]);
          setStatus("ok");
          return;
        }

        const data = await listingsApi.getAll();
        if (!alive) return;

        const all = Array.isArray(data) ? data : [];
        const onlyFav = all
          .filter((x) => favoriteSet.has(String(x.id)))
          .map((x) => ({ ...normalizeListing(x), isFavorite: true }));

        setItems(onlyFav);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError(e?.message || "Failed to load favorites");
      }
    })();

    return () => {
      alive = false;
    };
  }, [canFavorite, favoriteSet]);

  // если favoriteSet изменился — синкаем items (без лишних загрузок)
  useEffect(() => {
    if (!canFavorite) return;

    setItems((prev) =>
      prev
        .filter((x) => favoriteSet.has(String(x.id)))
        .map((x) => ({ ...x, isFavorite: true }))
    );
  }, [canFavorite, favoriteSet]);

  const onToggleFav = useCallback(
    async (listingId) => {
      if (!canFavorite) return;
      await onToggleFavorite?.(listingId);
      // items обновятся эффектом выше
    },
    [canFavorite, onToggleFavorite]
  );

  const isEmpty = status === "ok" && items.length === 0;
  const title = useMemo(() => `Обране`, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>{title}</h1>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/listings")}
          >
            До каталогу
          </button>
        </div>

        <div className={styles.top}>
          <SearchPanel />
        </div>

        <div ref={resultsRef}>
          {status === "loading" && (
            <div className={styles.state}>Завантаження…</div>
          )}

          {status === "error" && (
            <div className={`${styles.state} ${styles.stateError}`}>
              Помилка: {error}
            </div>
          )}
        </div>

        {!canFavorite && status === "ok" && (
          <div className={styles.empty}>Увійди, щоб бачити обране.</div>
        )}

        {canFavorite && isEmpty && (
          <div className={styles.empty}>
            Поки що порожньо. Натисни ❤️ на оголошенні в каталозі.
          </div>
        )}

        {status === "ok" && items.length > 0 && (
          <div className={styles.grid}>
            {items.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onToggleFav={onToggleFav}
                canFavorite={canFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
