import { useMemo } from "react";
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

function stripCityFromAddress(address, cityLabel) {
  if (!address || !cityLabel) return address || "";

  // убираем ", Київ" / "Київ" / ", Kyiv" и т.п.
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

export default function ListingCard({ listing, onToggleFav, canFavorite }) {
  const location = useLocation();

  const cityLabel = useMemo(() => getCityLabel(listing?.city), [listing?.city]);
  const fav = Boolean(listing?.isFavorite);

  const priceLabel = `${formatPrice(listing?.price)} грн/міс.`;
  const cover = getCoverImage(listing);

  const availableFromLabel = useMemo(
    () => formatDateOnly(listing?.availableFrom),
    [listing?.availableFrom],
  );

  const areaLabel =
    typeof listing?.area === "number" ? `${listing.area} м2` : "—";
  const roomsLabel =
    typeof listing?.rooms === "number" ? String(listing.rooms) : "—";

  const title = listing?.title || listing?.address || "Без назви";
  const streetLine = stripCityFromAddress(listing?.address, cityLabel);

  const features = useMemo(() => buildFeatures(listing), [listing]);

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFav?.(listing?.id);
  };

  return (
    <Link
      to={`/listings/${listing?.id}`}
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
