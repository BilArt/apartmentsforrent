import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { favoritesApi } from "../api/favorites";

function normalizeFavoriteIds(payload) {
  const arr = Array.isArray(payload) ? payload : [];

  return arr
    .map((x) => (typeof x === "string" ? x : (x?.listingId ?? x?.id ?? null)))
    .filter(Boolean)
    .map(String);
}

export function useFavorites(currentUser) {
  const canFavorite = Boolean(currentUser?.id);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  const reqSeq = useRef(0);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const reloadFavorites = useCallback(async () => {
    const seq = ++reqSeq.current;

    if (!canFavorite) {
      setFavoriteIds([]);
      setFavLoading(false);
      return;
    }

    setFavLoading(true);
    try {
      const fav = await favoritesApi.getMy();
      if (seq !== reqSeq.current) return;

      setFavoriteIds(normalizeFavoriteIds(fav));
    } catch {
      if (seq !== reqSeq.current) return;
      setFavoriteIds([]);
    } finally {
      if (seq === reqSeq.current) setFavLoading(false);
    }
  }, [canFavorite]);

  useEffect(() => {
    reloadFavorites();
  }, [reloadFavorites]);

  const toggleFavorite = useCallback(
    async (listingId) => {
      if (!canFavorite) return { isFavorite: false };

      const key = String(listingId);

      let nextIsFavorite = false;

      setFavoriteIds((prev) => {
        const set = new Set(prev);
        if (set.has(key)) {
          set.delete(key);
          nextIsFavorite = false;
        } else {
          set.add(key);
          nextIsFavorite = true;
        }
        return Array.from(set);
      });

      try {
        const res = await favoritesApi.toggle(key);
        const isFavorite = Boolean(res?.isFavorite);

        setFavoriteIds((prev) => {
          const set = new Set(prev);
          if (isFavorite) set.add(key);
          else set.delete(key);
          return Array.from(set);
        });

        return { isFavorite };
      } catch {
        await reloadFavorites();
        return { isFavorite: nextIsFavorite };
      }
    },
    [canFavorite, reloadFavorites]
  );

  return {
    canFavorite,
    favoriteIds,
    favoriteSet,
    favLoading,
    reloadFavorites,
    toggleFavorite,
  };
}
