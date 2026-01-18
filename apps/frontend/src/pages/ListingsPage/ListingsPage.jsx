import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SearchPanel from "../../components/SearchPanel/SearchPanel";
import ListingCard from "../../components/ListingCard/ListingCard";
import styles from "./ListingsPage.module.scss";
import { useRef } from "react";

export default function ListingsPage() {
  const [sp, setSp] = useSearchParams();

  const page = Math.max(1, Number(sp.get("page") || 1));
  const perPage = 8;
  const resultsRef = useRef(null);

  const mock = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: String(i + 1),
        title: "вул. Театральна 8",
        city: { nameUk: "Київ" },
        price: 25000,
        districtLabel: "Шевченківський",
        availableFromLabel: "Зараз",
        area: 60,
        rooms: 3,
        isFavorite: i === 0,
      })),
    []
  );

  const totalPages = Math.max(1, Math.ceil(mock.length / perPage));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return mock.slice(start, start + perPage);
  }, [mock, safePage]);

  const goToPage = (nextPage) => {
    const p = Math.min(Math.max(1, nextPage), totalPages);

    const next = new URLSearchParams(sp);
    next.set("page", String(p));
    setSp(next, { replace: false });

    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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

        <div ref={resultsRef} className={styles.grid}>
          {pageItems.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>

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
              >
                {p}
              </button>
            );
          })}

          {totalPages > pagesToShow[pagesToShow.length - 1] && (
            <span className={styles.dots}>…</span>
          )}
        </div>
      </div>
    </div>
  );
}
