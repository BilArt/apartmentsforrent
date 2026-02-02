import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./FavoritesPage.module.scss";
import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import { listingsApi } from "../../api/listings";
import { favoritesApi } from "../../api/favorites";

function extractFavIds(payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((x) => (typeof x === "string" ? x : (x?.listingId ?? x?.id ?? null)))
    .filter(Boolean)
    .map(String);
}

export default function FavoritesPage({ currentUser } = {}) {
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const canFavorite = Boolean(currentUser?.id);

  const allListingsRef = useRef(null);

  const fetchFavoritesData = useCallback(
    async (signal) => {
      if (!canFavorite) {
        return { items: [], error: "" };
      }

      const fav = await favoritesApi.getMy();
      if (signal?.aborted) return null;

      const favIds = extractFavIds(fav);
      const favSet = new Set(favIds);

      if (favSet.size === 0) {
        return { items: [], error: "" };
      }

      let all = allListingsRef.current;
      if (!Array.isArray(all)) {
        const data = await listingsApi.getAll();
        if (signal?.aborted) return null;
        all = Array.isArray(data) ? data : [];
        allListingsRef.current = all;
      }

      const onlyFav = all
        .filter((x) => favSet.has(String(x.id)))
        .map((x) => ({ ...x, isFavorite: true }));

      return { items: onlyFav, error: "" };
    },
    [canFavorite]
  );

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const res = await fetchFavoritesData(controller.signal);
        if (!res || controller.signal.aborted) return;

        setItems(res.items);
        setStatus("ok");
      } catch (e) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(e?.message || "Failed to load favorites");
      }
    })();

    return () => controller.abort();
  }, [fetchFavoritesData, currentUser?.id]);

  const refreshFavorites = useCallback(async () => {
    const controller = new AbortController();
    try {
      setStatus("loading");
      setError("");
      const res = await fetchFavoritesData(controller.signal);
      if (!res) return;
      setItems(res.items);
      setStatus("ok");
    } catch {
      // 
    }
  }, [fetchFavoritesData]);

  const onToggleFav = useCallback(
    async (listingId) => {
      if (!canFavorite) return;

      setItems((prev) =>
        prev.filter((x) => String(x.id) !== String(listingId))
      );

      try {
        const res = await favoritesApi.toggle(listingId);
        const isFavorite = Boolean(res?.isFavorite);

        if (!isFavorite) return;

        let all = allListingsRef.current;
        if (!Array.isArray(all)) {
          const data = await listingsApi.getAll();
          all = Array.isArray(data) ? data : [];
          allListingsRef.current = all;
        }

        const found = all.find((x) => String(x.id) === String(listingId));
        if (found) {
          setItems((prev) => [{ ...found, isFavorite: true }, ...prev]);
        } else {
          await refreshFavorites();
        }
      } catch {
        await refreshFavorites();
      }
    },
    [canFavorite, refreshFavorites]
  );

  const isEmpty = status === "ok" && items.length === 0;
  const title = useMemo(() => "Обране", []);

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
