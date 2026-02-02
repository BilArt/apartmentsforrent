import { useCallback, useEffect, useMemo, useState } from 'react';
import { favoritesApi } from '../api/favorites';

function normalizeFavoriteIds(payload) {
  const ids = Array.isArray(payload)
    ? payload
        .map((x) =>
          typeof x === 'string' ? x : (x?.listingId ?? x?.id ?? null),
        )
        .filter(Boolean)
    : [];
  return ids.map(String);
}

export function useFavorites(currentUser) {
  const canFavorite = Boolean(currentUser?.id);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const reloadFavorites = useCallback(async () => {
    if (!canFavorite) {
      setFavoriteIds([]);
      return;
    }

    setFavLoading(true);
    try {
      const fav = await favoritesApi.getMy();
      setFavoriteIds(normalizeFavoriteIds(fav));
    } catch {
      setFavoriteIds([]);
    } finally {
      setFavLoading(false);
    }
  }, [canFavorite]);

  useEffect(() => {
    reloadFavorites();
  }, [reloadFavorites]);

  const toggleFavorite = useCallback(
    async (listingId) => {
      if (!canFavorite) return { isFavorite: false };

      const key = String(listingId);

      let optimisticIsFav = false;
      setFavoriteIds((prev) => {
        const set = new Set(prev);
        if (set.has(key)) {
          set.delete(key);
          optimisticIsFav = false;
        } else {
          set.add(key);
          optimisticIsFav = true;
        }
        return Array.from(set);
      });

      try {
        const res = await favoritesApi.toggle(listingId);
        const isFavorite = Boolean(res?.isFavorite);

        setFavoriteIds((prev) => {
          const set = new Set(prev);
          if (isFavorite) set.add(key);
          else set.delete(key);
          return Array.from(set);
        });

        return { isFavorite };
      } catch {
        // откат + попытка синка
        await reloadFavorites();
        return { isFavorite: optimisticIsFav };
      }
    },
    [canFavorite, reloadFavorites],
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
