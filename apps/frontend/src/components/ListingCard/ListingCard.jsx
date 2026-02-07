import { useMemo, useRef, useState } from "react";
import styles from "./ListingCard.module.scss";
import { Link, useLocation } from "react-router-dom";

import FavoriteIcon from "../../assets/svg/favorite.svg?react";
import { API_BASE_URL } from "../../api/config";

function getCityLabel(city) {
  if (typeof city === "string") {
    if (city === "Kyiv") return "Київ";
    if (city === "Lviv") return "Львів";
    return city;
  }

  if (city && typeof city === "object") {
    return city.nameUk || city.name || "—";
  }

  return "—";
}

function stripCityFromAddress(address, cityLabel) {
  if (!address || !cityLabel) return address || "";

  const escapedCity = cityLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`,?\\s*${escapedCity}$`, "i");

  return address.replace(re, "").trim();
}

function buildFeatures(listing) {
  const f = listing?.features || listing;

  const items = [
    { key: "kitchen", label: "Окрема кухня", on: Boolean(f?.kitchen) },
    { key: "balcony", label: "Балкон", on: Boolean(f?.balcony) },
    { key: "pets", label: "Тварини", on: Boolean(f?.pets) },
    { key: "lift", label: "Ліфт", on: Boolean(f?.lift) },
    { key: "parking", label: "Паркінг", on: Boolean(f?.parking) },
    { key: "furnished", label: "З меблями", on: Boolean(f?.furnished) },
    { key: "storage", label: "Комора", on: Boolean(f?.storage) },
  ];

  return items.filter((x) => x.on);
}

function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("uk-UA");
}

function formatDateOnly(value) {
  if (!value) return "—";
  const d =
    value instanceof Date
      ? value
      : new Date(
          typeof value === "string" || typeof value === "number" ? value : "",
        );
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function pickImages(listing) {
  const imgs = listing?.images;
  const list = Array.isArray(imgs) ? imgs : [];

  const pick = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object" && typeof val.url === "string") return val.url;
    return null;
  };

  return list.map(pick).filter(Boolean);
}

function resolveImgSrc(src) {
  if (!src) return null;

  if (/^https?:\/\//i.test(src)) return src;

  if (src.startsWith("/")) return `${API_BASE_URL}${src}`;

  return `${API_BASE_URL}/media/listings/${src}`;
}

function useCarousel(images) {
  const [idx, setIdx] = useState(0);

  const hasMany = (images?.length || 0) > 1;

  const prev = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!images?.length) return;
    setIdx((v) => (v - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!images?.length) return;
    setIdx((v) => (v + 1) % images.length);
  };

  const go = (n, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIdx(n);
  };

  return { idx, setIdx, hasMany, prev, next, go };
}

export default function ListingCard({ listing, onToggleFav, canFavorite }) {
  const location = useLocation();

  const cityLabel = useMemo(() => getCityLabel(listing?.city), [listing?.city]);
  const fav = Boolean(listing?.isFavorite);

  const priceLabel = `${formatPrice(listing?.price)} грн/міс.`;

  const availableFromLabel = useMemo(
    () => formatDateOnly(listing?.availableFrom),
    [listing?.availableFrom],
  );

  const areaLabel =
    typeof listing?.area === "number" ? `${listing.area} м²` : "—";
  const roomsLabel =
    typeof listing?.rooms === "number" ? String(listing.rooms) : "—";

  const title = listing?.title || listing?.address || "Без назви";
  const streetLine = stripCityFromAddress(listing?.address, cityLabel);

  const features = useMemo(() => buildFeatures(listing), [listing]);

  const rawImages = useMemo(() => pickImages(listing), [listing]);
  const images = useMemo(
    () => rawImages.map(resolveImgSrc).filter(Boolean),
    [rawImages],
  );

  const hasImages = images.length > 0;

  const imagesKey = useMemo(() => {
    const first = images[0] || "";
    return `${String(listing?.id || "")}:${images.length}:${first}`;
  }, [images, listing?.id]);

  const { idx, setIdx, hasMany, prev, next, go } = useCarousel(images);

  const [imgBroken, setImgBroken] = useState(false);

  const safeIdx = hasImages ? Math.min(idx, images.length - 1) : 0;

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFav?.(listing?.id);
  };

  const touchRef = useRef({ x: 0, y: 0, active: false });

  const onTouchStart = (e) => {
    if (!hasMany) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };

  const onTouchEnd = (e) => {
    if (!hasMany) return;
    if (!touchRef.current.active) return;

    const t = e.changedTouches?.[0];
    touchRef.current.active = false;
    if (!t) return;

    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx > 35) prev(e);
    if (dx < -35) next(e);
  };

  return (
    <Link
      to={`/listings/${listing?.id}`}
      state={{ from: location }}
      className={styles.linkWrap}
      aria-label={`Open listing: ${title}`}
    >
      <article className={styles.card}>
        <div
          key={imagesKey}
          className={styles.media}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {hasImages && !imgBroken ? (
            <>
              <img
                className={styles.cover}
                src={images[safeIdx]}
                alt={title}
                loading="lazy"
                onError={() => setImgBroken(true)}
              />

              {hasMany && (
                <>
                  <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navPrev}`}
                    onClick={(e) => {
                      setImgBroken(false);
                      prev(e);
                    }}
                    aria-label="Prev photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.navBtn} ${styles.navNext}`}
                    onClick={(e) => {
                      setImgBroken(false);
                      next(e);
                    }}
                    aria-label="Next photo"
                  >
                    ›
                  </button>

                  <div className={styles.dots} aria-label="Photos">
                    {images.slice(0, 10).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.dot} ${
                          i === safeIdx ? styles.dotActive : ""
                        }`}
                        onClick={(e) => {
                          setImgBroken(false);
                          setIdx(i);
                          go(i, e);
                        }}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={styles.noPhoto} aria-label="No photo">
              Фото нема
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            <div className={styles.headings}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.city}>{cityLabel}</div>
              <div className={styles.street}>{streetLine}</div>
            </div>

            {canFavorite && (
              <button
                type="button"
                className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
                onClick={toggleFav}
                aria-label={fav ? "Remove from favorites" : "Add to favorites"}
              >
                <FavoriteIcon className={styles.heartIcon} />
              </button>
            )}
          </div>

          <div className={styles.price}>{priceLabel}</div>

          {features.length > 0 && (
            <div className={styles.features} aria-label="Features">
              {features.slice(0, 4).map((f) => (
                <span key={f.key} className={styles.featurePill}>
                  {f.label}
                </span>
              ))}
              {features.length > 4 && (
                <span className={styles.featureMore}>
                  +{features.length - 4}
                </span>
              )}
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Доступно від</div>
              <div className={styles.metaValue}>{availableFromLabel}</div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Метраж</div>
              <div className={styles.metaValue}>{areaLabel}</div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Кімнат</div>
              <div className={styles.metaValue}>{roomsLabel}</div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
