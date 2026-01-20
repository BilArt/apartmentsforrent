import { useMemo, useState } from "react";
import styles from "./ListingCard.module.scss";
import { Link, useLocation } from "react-router-dom";

import FavoriteIcon from "../../assets/svg/favorite.svg?react";

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

function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("uk-UA");
}

function getCoverImage(listing) {
  const imgs = listing?.images;
  const list = Array.isArray(imgs) ? imgs : [];

  const pick = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.url) return val.url;
    return null;
  };

  const first = list.length ? pick(list[0]) : null;

  const resolveSrc = (src) => {
    if (!src) return null;

    if (/^https?:\/\//i.test(src)) return src;

    if (src.startsWith("/")) return src;

    return `/media/listings/${src}`;
  };

  const resolved = resolveSrc(first);
  if (resolved) return resolved;

  return "/media/listings/placeholder-1.jpg";
}

export default function ListingCard({ listing, onToggleFav }) {
  const location = useLocation();
  const cityLabel = useMemo(() => getCityLabel(listing.city), [listing.city]);
  const [fav, setFav] = useState(Boolean(listing.isFavorite));

  const priceLabel = `${formatPrice(listing.price)} грн/міс.`;
  const cover = getCoverImage(listing);

  const districtLabel = listing.districtLabel || listing.district || null;
  const availableFromLabel =
    listing.availableFromLabel || listing.availableFrom || null;
  const areaLabel = listing.area ? `${listing.area} м2` : null;
  const roomsLabel =
    typeof listing.rooms === "number" && listing.rooms > 0
      ? String(listing.rooms)
      : null;

  const title = listing.title || listing.address || "Без назви";
  const addressLine = listing.address || "";

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFav((v) => !v);
    onToggleFav?.(listing);
  };

  return (
    <Link
      to={`/listings/${listing.id}`}
      state={{ from: location }}
      className={styles.linkWrap}
      aria-label={`Open listing: ${title}`}
    >
      <article className={styles.card}>
        <div className={styles.media}>
          <img
            className={styles.cover}
            src={cover}
            alt={title}
            loading="lazy"
          />
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            <div className={styles.headings}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.city}>{cityLabel}</div>
            </div>

            <button
              type="button"
              className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
              onClick={toggleFav}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            >
              <FavoriteIcon className={styles.heartIcon} />
            </button>
          </div>

          <div className={styles.price}>{priceLabel}</div>

          <div className={styles.divider} />

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Район</div>
              <div className={styles.metaValue}>{districtLabel ?? "—"}</div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Доступно від</div>
              <div className={styles.metaValue}>
                {availableFromLabel ?? "—"}
              </div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Метраж</div>
              <div className={styles.metaValue}>{areaLabel ?? "—"}</div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Кількість кімнат</div>
              <div className={styles.metaValue}>{roomsLabel ?? "—"}</div>
            </div>
          </div>

          {addressLine ? (
            <div className={styles.address}>{addressLine}</div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
