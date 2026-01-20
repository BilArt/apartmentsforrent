import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listingsApi } from "../../api/listings";
import styles from "./ListingDetailsPage.module.scss";

function getCityLabel(city) {
  if (typeof city === "string") return city;
  if (city && typeof city === "object") return city.nameUk || city.name || "—";
  return "—";
}

function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("uk-UA");
}

function getImages(listing) {
  const imgs = listing?.images;
  const list = Array.isArray(imgs) ? imgs : [];

  const pick = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.url) return val.url;
    return null;
  };

  const mapped = list.map(pick).filter(Boolean);

  const resolveSrc = (src) => {
    if (!src) return null;

    if (/^https?:\/\//i.test(src)) return src;

    if (!src.startsWith("/")) return `/media/listings/${src}`;

    return src;
  };

  const resolved = mapped.map(resolveSrc).filter(Boolean);

  if (!resolved.length) return ["/media/listings/placeholder-1.jpg"];

  return resolved;
}

export default function ListingDetailsPage({ onRequestViewing }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const data = await listingsApi.getById(listingId);

        if (!alive) return;
        setItem(data);
        setStatus("ok");
        setActiveImg(0);
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError(e?.message || "Failed to load listing");
      }
    })();

    return () => {
      alive = false;
    };
  }, [listingId]);

  const backTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/listings";

  const title = item?.title || item?.address || "Оголошення";
  const cityLabel = useMemo(() => getCityLabel(item?.city), [item?.city]);
  const priceLabel = item ? `${formatPrice(item.price)} грн/міс.` : "";
  const images = useMemo(() => getImages(item), [item]);
  const mainImage = images[Math.min(activeImg, images.length - 1)];

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
            Помилка завантаження: {error}
          </div>
        )}

        {status === "ok" && item && (
          <div className={styles.layout}>
            {/* LEFT */}
            <div className={styles.left}>
              <div className={styles.galleryCard}>
                <div className={styles.galleryMain}>
                  <img src={mainImage} alt={title} className={styles.mainImg} />
                </div>

                {images.length > 1 && (
                  <div
                    className={styles.thumbs}
                    role="tablist"
                    aria-label="Photos"
                  >
                    {images.slice(0, 6).map((src, idx) => {
                      const isActive = idx === activeImg;
                      return (
                        <button
                          key={`${src}-${idx}`}
                          type="button"
                          className={
                            isActive ? styles.thumbBtnActive : styles.thumbBtn
                          }
                          onClick={() => setActiveImg(idx)}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <img src={src} alt="" className={styles.thumbImg} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.mainCard}>
                <div className={styles.headerRow}>
                  <div>
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.subtitle}>
                      {cityLabel}
                      {item.address ? ` • ${item.address}` : ""}
                    </div>
                  </div>

                  <div className={styles.price}>{priceLabel}</div>
                </div>

                <div className={styles.divider} />

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Орендодавець</div>
                    <div className={styles.metaValue}>
                      {item.landlordName || "—"}
                      {typeof item.landlordRating === "number"
                        ? ` (Рейтинг: ${item.landlordRating})`
                        : ""}
                    </div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Місто</div>
                    <div className={styles.metaValue}>{cityLabel}</div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Адреса</div>
                    <div className={styles.metaValue}>
                      {item.address || "—"}
                    </div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>ID</div>
                    <div className={styles.metaValue}>{item.id}</div>
                  </div>

                  {typeof item.rooms === "number" && item.rooms > 0 ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Кімнати</div>
                      <div className={styles.metaValue}>{item.rooms}</div>
                    </div>
                  ) : null}

                  {typeof item.area === "number" && item.area > 0 ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Метраж</div>
                      <div className={styles.metaValue}>{item.area} м2</div>
                    </div>
                  ) : null}

                  {item.availableFrom ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Доступно від</div>
                      <div className={styles.metaValue}>
                        {String(item.availableFrom)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {item.description ? (
                  <>
                    <div className={styles.divider} />
                    <h2 className={styles.h2}>Опис</h2>
                    <p className={styles.desc}>{item.description}</p>
                  </>
                ) : null}
              </div>
            </div>

            {/* RIGHT */}
            <aside className={styles.right}>
              <div className={styles.sideCard}>
                <div className={styles.sideTitle}>Швидкі дії</div>

                <button type="button" className={styles.primaryBtn}>
                  Написати орендодавцю
                </button>

                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => onRequestViewing?.(item?.id)}
                  disabled={!item?.id}
                >
                  Запросити перегляд
                </button>

                <div className={styles.sideNote}>
                  (Поки це заглушки. Далі підключимо чат/заявку.)
                </div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideTitle}>Безпека</div>
                <ul className={styles.bullets}>
                  <li>Підтверджена особа через BankID</li>
                  <li>Рейтинг орендодавця без “обнулення”</li>
                  <li>Прозорі умови угоди</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
