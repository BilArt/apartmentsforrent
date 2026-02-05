import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import styles from "./ListingsPage.module.scss";
import { listingsApi } from "../../api/listings";

function toInt(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toNumOrNull(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStr(v) {
  return String(v ?? "").trim();
}

function toLower(v) {
  const s = toStr(v);
  return s ? s.toLowerCase() : "";
}

function toNumOrNullSafe(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toISODateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeAvailableFrom(x) {
  const src = x?.availableFrom ?? x?.availableFromDate ?? null;
  const s = toStr(src);
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return toISODateOnly(d);
}

function normalizeListing(x) {
  const price = toNumOrNullSafe(x?.price);
  const area = toNumOrNullSafe(x?.area);
  const rooms = toNumOrNullSafe(x?.rooms);

  return {
    ...x,
    price: price ?? 0,
    area,
    rooms,
    buildingType: toLower(x?.buildingType),
    rentType: toLower(x?.rentType),
    availableFrom: normalizeAvailableFrom(x),

    kitchen: Boolean(x?.kitchen),
    pets: Boolean(x?.pets),
    lift: Boolean(x?.lift),
    parking: Boolean(x?.parking),
    furnished: Boolean(x?.furnished),
    balcony: Boolean(x?.balcony),
    storage: Boolean(x?.storage),
  };
}

function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);

  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d)
    return null;

  dt.setHours(0, 0, 0, 0);
  return dt;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function ListingsPage({
  canFavorite = false,
  favoriteSet = new Set(),
  onToggleFavorite,
} = {}) {
  const [sp, setSp] = useSearchParams();
  const resultsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const page = Math.max(1, toInt(sp.get("page") || 1, 1));
  const perPage = 8;

  const onlyFav = sp.get("fav") === "1";

  const filters = useMemo(() => {
    const city = (sp.get("city") || "").trim().toLowerCase();
    const buildingType = (sp.get("buildingType") || "").trim().toLowerCase();
    const rentType = (sp.get("rentType") || "").trim().toLowerCase();

    const priceFrom = toNumOrNull(sp.get("priceFrom"));
    const priceTo = toNumOrNull(sp.get("priceTo"));
    const areaFrom = toNumOrNull(sp.get("areaFrom"));
    const areaTo = toNumOrNull(sp.get("areaTo"));

    const rooms = toInt(sp.get("rooms") || 0, 0);

    const from = sp.get("from");
    const fromDate = parseISODate(sp.get("fromDate") || "");
    const today = startOfDay(new Date());
    const availableFrom = from === "today" ? today : fromDate ? fromDate : null;

    const bool = (k) => sp.get(k) === "1";

    return {
      city,
      buildingType,
      rentType,
      priceFrom,
      priceTo,
      areaFrom,
      areaTo,
      rooms,
      availableFrom,
      kitchen: bool("kitchen"),
      pets: bool("pets"),
      lift: bool("lift"),
      parking: bool("parking"),
      furnished: bool("furnished"),
      balcony: bool("balcony"),
      storage: bool("storage"),
    };
  }, [sp.toString()]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const data = await listingsApi.getAll();
        if (!alive) return;

        const normalized = (Array.isArray(data) ? data : []).map(
          normalizeListing,
        );
        setItems(normalized);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError(e?.message || "Failed to load listings");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!canFavorite && onlyFav) {
      const next = new URLSearchParams(sp);
      next.delete("fav");
      next.set("page", "1");
      setSp(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFavorite, onlyFav]);

  useEffect(() => {
    const next = new URLSearchParams(sp);
    const pageNow = next.get("page") || "1";
    if (pageNow !== "1") {
      next.set("page", "1");
      setSp(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.city,
    filters.buildingType,
    filters.rentType,
    String(filters.priceFrom),
    String(filters.priceTo),
    String(filters.areaFrom),
    String(filters.areaTo),
    String(filters.rooms),
    String(filters.availableFrom?.toISOString?.() || ""),
    filters.kitchen,
    filters.pets,
    filters.lift,
    filters.parking,
    filters.furnished,
    filters.balcony,
    filters.storage,
    onlyFav,
  ]);

  const hasAnyFavorites = canFavorite && favoriteSet.size > 0;

  const itemsWithFav = useMemo(() => {
    return items.map((x) => ({
      ...x,
      isFavorite: canFavorite ? favoriteSet.has(String(x.id)) : false,
    }));
  }, [items, favoriteSet, canFavorite]);

  const filtered = useMemo(() => {
    return itemsWithFav.filter((l) => {
      if (onlyFav && !l?.isFavorite) return false;

      if (filters.city) {
        const cityName = (l?.city?.nameUk || l?.city?.name || "")
          .toString()
          .toLowerCase();
        const title = (l?.title || "").toString().toLowerCase();
        const address = (l?.address || "").toString().toLowerCase();
        const hay = `${cityName} ${title} ${address}`;
        if (!hay.includes(filters.city)) return false;
      }

      if (filters.buildingType) {
        const bt = (l?.buildingType || "").toString().toLowerCase();
        if (!bt) return false;
        if (bt !== filters.buildingType) return false;
      }

      if (filters.rentType) {
        const rt = (l?.rentType || "").toString().toLowerCase();
        if (!rt) return false;
        if (rt !== filters.rentType) return false;
      }

      if (filters.priceFrom !== null) {
        if (typeof l?.price !== "number") return false;
        if (l.price < filters.priceFrom) return false;
      }
      if (filters.priceTo !== null) {
        if (typeof l?.price !== "number") return false;
        if (l.price > filters.priceTo) return false;
      }

      if (filters.areaFrom !== null) {
        const a = typeof l?.area === "number" ? l.area : null;
        if (a === null) return false;
        if (a < filters.areaFrom) return false;
      }
      if (filters.areaTo !== null) {
        const a = typeof l?.area === "number" ? l.area : null;
        if (a === null) return false;
        if (a > filters.areaTo) return false;
      }

      if (filters.rooms > 0) {
        const r = typeof l?.rooms === "number" ? l.rooms : null;
        if (r === null) return false;
        if (r !== filters.rooms) return false;
      }

      if (filters.availableFrom) {
        const dt = parseISODate(l?.availableFrom);
        if (!dt) return false;
        if (dt > filters.availableFrom) return false;
      }

      const checkBool = (key, enabled) => {
        if (!enabled) return true;
        return Boolean(l?.[key]);
      };

      if (!checkBool("kitchen", filters.kitchen)) return false;
      if (!checkBool("pets", filters.pets)) return false;
      if (!checkBool("lift", filters.lift)) return false;
      if (!checkBool("parking", filters.parking)) return false;
      if (!checkBool("furnished", filters.furnished)) return false;
      if (!checkBool("balcony", filters.balcony)) return false;
      if (!checkBool("storage", filters.storage)) return false;

      return true;
    });
  }, [itemsWithFav, onlyFav, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage]);

  const goToPage = useCallback(
    (nextPage) => {
      const p = Math.min(Math.max(1, nextPage), totalPages);

      const next = new URLSearchParams(sp);
      next.set("page", String(p));
      setSp(next, { replace: false });

      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [sp, setSp, totalPages],
  );

  const setFavMode = useCallback(
    (on) => {
      const next = new URLSearchParams(sp);

      if (!canFavorite) {
        next.delete("fav");
      } else {
        if (on) next.set("fav", "1");
        else next.delete("fav");
      }

      next.set("page", "1");
      setSp(next, { replace: false });

      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [sp, setSp, canFavorite],
  );

  const onToggleFav = useCallback(
    async (listingId) => {
      if (!canFavorite) return;
      await onToggleFavorite?.(listingId);
    },
    [canFavorite, onToggleFavorite],
  );

  const pagesToShow = useMemo(() => {
    const max = Math.min(5, totalPages);
    return Array.from({ length: max }).map((_, i) => i + 1);
  }, [totalPages]);

  const emptyText = useMemo(() => {
    if (onlyFav) {
      if (!canFavorite) return "Увійди, щоб користуватись обраним.";
      if (!hasAnyFavorites)
        return "У тебе поки що немає обраних. Натисни ❤️ на оголошенні.";
      return "У обраних нічого не знайдено за цими фільтрами.";
    }
    return "Нічого не знайдено за цими фільтрами.";
  }, [onlyFav, canFavorite, hasAnyFavorites]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.top}>
          <SearchPanel />
        </div>

        {status === "loading" && (
          <div className={styles.state}>Завантаження…</div>
        )}

        {status === "error" && (
          <div className={styles.stateError}>Помилка завантаження: {error}</div>
        )}

        {status === "ok" && (
          <>
            <div className={styles.favToggleWrap}>
              <div
                className={styles.favToggle}
                role="tablist"
                aria-label="View"
              >
                <button
                  type="button"
                  className={`${styles.favToggleBtn} ${
                    !onlyFav ? styles.favToggleActive : ""
                  }`}
                  onClick={() => setFavMode(false)}
                  aria-pressed={!onlyFav}
                >
                  Усі
                </button>

                <button
                  type="button"
                  className={`${styles.favToggleBtn} ${
                    onlyFav ? styles.favToggleActive : ""
                  }`}
                  onClick={() => setFavMode(true)}
                  aria-pressed={onlyFav}
                  disabled={!canFavorite}
                  title={
                    !canFavorite ? "Увійди, щоб користуватись обраним" : ""
                  }
                >
                  Обрані
                </button>
              </div>
            </div>

            {!canFavorite && (
              <div className={styles.state} style={{ padding: "0 0 12px" }}>
                Увійди, щоб додавати оголошення в обране.
              </div>
            )}

            {onlyFav && canFavorite && !hasAnyFavorites && (
              <div className={styles.state} style={{ padding: "0 0 12px" }}>
                У тебе поки що немає обраних. Натисни ❤️ на оголошенні.
              </div>
            )}

            <div className={styles.grid}>
              {pageItems.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onToggleFav={onToggleFav}
                  canFavorite={canFavorite}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 16, opacity: 0.7 }}>{emptyText}</div>
            )}

            {filtered.length > 0 && (
              <div
                className={styles.pagination}
                role="navigation"
                aria-label="Pagination"
              >
                {pagesToShow.map((p) => {
                  const active = p === safePage;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={active ? styles.pageBtnActive : styles.pageBtn}
                      onClick={() => goToPage(p)}
                      aria-current={active ? "page" : undefined}
                      disabled={active}
                    >
                      {p}
                    </button>
                  );
                })}

                {totalPages > pagesToShow[pagesToShow.length - 1] && (
                  <span className={styles.dots}>…</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
