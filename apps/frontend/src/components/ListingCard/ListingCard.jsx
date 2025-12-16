import styles from './ListingCard.module.scss';

function ListingCard({ listing }) {
  const {
    title,
    city,
    address,
    description,
  } = listing;

  const landlordName = listing.landlordName;
  const landlordRating = listing.landlordRating ?? 0;

  return (
    <article className={styles.card}>
      <div className={styles.photoPlaceholder}>
        Фото буде пізніше
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>

        <p className={styles.location}>
          {city}, {address}
        </p>

        <p className={styles.description}>{description}</p>

        <div className={styles.footer}>
          <span className={styles.landlord}>
            Орендодавець: {landlordName}
          </span>

          <span className={styles.rating}>
            Рейтинг: {landlordRating.toFixed(1)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
