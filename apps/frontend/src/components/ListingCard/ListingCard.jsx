import { useMemo, useState } from "react";
import styles from "./ListingCard.module.scss";
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
  // 25000 -> "25 000"
  return value.toLocaleString("uk-UA");
}

function getCoverImage(listing) {
  // если потом добавишь listing.images = [{url: "..."}] или ["..."]
  const imgs = listing?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && first.url) return first.url;
  }

  // безопасная заглушка (замени на свой ассет при желании)
  return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";
}

export default function ListingCard({ listing, onToggleFav }) {
  const cityLabel = useMemo(() => getCityLabel(listing.city), [listing.city]);

  // локально держим фаворит, пока не подключили стор/апи
  const [fav, setFav] = useState(Boolean(listing.isFavorite));

  const priceLabel = `${formatPrice(listing.price)} грн/міс.`;
  const cover = getCoverImage(listing);

  // эти поля появятся позже — сейчас просто “не показываем, если нет”
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
    <article className={styles.card}>
      <div className={styles.media}>
        <img className={styles.cover} src={cover} alt={title} loading="lazy" />
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
            <div className={styles.metaValue}>{availableFromLabel ?? "—"}</div>
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

        {/* опционально адрес строкой (если хочешь как в макете “вул. ...”) */}
        {addressLine ? (
          <div className={styles.address}>{addressLine}</div>
        ) : null}
      </div>
    </article>
  );
}
