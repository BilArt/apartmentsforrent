import styles from "./ListingCard.module.scss";

function getCityLabel(city) {
  // старый формат (строка)
  if (typeof city === "string") {
    // можешь оставить просто city
    // или сделать красивый маппинг:
    if (city === "Kyiv") return "Київ";
    if (city === "Lviv") return "Львів";
    return city;
  }

  // новый формат (объект)
  if (city && typeof city === "object") {
    return city.nameUk || city.name || "—";
  }

  return "—";
}

function ListingCard({ listing }) {
  const cityLabel = getCityLabel(listing.city);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{listing.title}</h3>
        <p className={styles.price}>
          {typeof listing.price === "number" ? `${listing.price} грн` : "—"}
        </p>
      </div>

      <p className={styles.meta}>
        <span className={styles.city}>{cityLabel}</span>
        {listing.address ? <span> • {listing.address}</span> : null}
      </p>

      {listing.description ? (
        <p className={styles.desc}>{listing.description}</p>
      ) : null}

      <p className={styles.landlord}>
        {listing.landlordName ? listing.landlordName : "Орендодавець"}
        {typeof listing.landlordRating === "number"
          ? ` • ⭐ ${listing.landlordRating}`
          : ""}
      </p>
    </div>
  );
}

export default ListingCard;
