import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import styles from "./ListingsPage.module.scss";
import { listingsApi } from "../../api/listings";

function toInt(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams();

  const resultsRef = useRef(null);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const page = Math.max(1, toInt(sp.get("page") || 1, 1));
  const perPage = 8;

  const filters = useMemo(() => {
    const city = (sp.get("city") || "").trim().toLowerCase();
    return { city };
  }, [sp]);

  useEffect(() => {
    const next = new URLSearchParams(sp);

    const pageNow = next.get("page") || "1";

    const withoutPage = new URLSearchParams(sp);
    withoutPage.delete("page");

    if (pageNow !== "1") {
      next.set("page", "1");
      setSp(next, { replace: true });
    }
  }, [sp.toString()]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const data = await listingsApi.getAll();

        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
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

  const filtered = useMemo(() => {
    const q = filters.city;

    return items.filter((l) => {
      const cityName = (l?.city?.nameUk || l?.city?.name || "")
        .toString()
        .toLowerCase();

      const title = (l?.title || "").toString().toLowerCase();
      const address = (l?.address || "").toString().toLowerCase();

      if (q) {
        const hay = `${cityName} ${title} ${address}`;
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, filters.city]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage]);

  const goToPage = (nextPage) => {
    const p = Math.min(Math.max(1, nextPage), totalPages);

    const next = new URLSearchParams(sp);
    next.set("page", String(p));
    setSp(next, { replace: false });

    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pagesToShow = useMemo(() => {
    const max = Math.min(5, totalPages);
    return Array.from({ length: max }).map((_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.top}>
          <SearchPanel />
        </div>

        <div ref={resultsRef}>
          {status === "loading" && (
            <div style={{ padding: 12, opacity: 0.7 }}>Завантаження…</div>
          )}

          {status === "error" && (
            <div style={{ padding: 12, color: "#b00020" }}>
              Помилка завантаження: {error}
            </div>
          )}
        </div>

        {status === "ok" && (
          <>
            <div className={styles.grid}>
              {pageItems.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 16, opacity: 0.7 }}>
                Нічого не знайдено за цими фільтрами.
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
