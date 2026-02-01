import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./FavoritesPage.module.scss";
import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import { listingsApi } from "../../api/listings";
import { getFavoriteSet, toggleFavorite } from "../../utils/favorites";

export default function FavoritesPage() {
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

        const favSet = getFavoriteSet();
        if (favSet.size === 0) {
          setItems([]);
          setStatus("ok");
          return;
        }

        const data = await listingsApi.getAll();
        if (!alive) return;

        const all = Array.isArray(data) ? data : [];
        const onlyFav = all
          .filter((x) => favSet.has(String(x.id)))
          .map((x) => ({ ...x, isFavorite: true }));

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
  }, []);

  const onToggleFav = (listingId) => {
    const set = toggleFavorite(listingId);

    setItems((prev) => {
      if (!set.has(String(listingId))) {
        return prev.filter((x) => String(x.id) !== String(listingId));
      }
      return prev.map((x) =>
        String(x.id) === String(listingId) ? { ...x, isFavorite: true } : x
      );
    });
  };

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

        {isEmpty && (
          <div className={styles.empty}>
            Поки що порожньо. Натисни ❤️ на оголошенні в каталозі.
          </div>
        )}

        {status === "ok" && items.length > 0 && (
          <div className={styles.grid}>
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} onToggleFav={onToggleFav} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
