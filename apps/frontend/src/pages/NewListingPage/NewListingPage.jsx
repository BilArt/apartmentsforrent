import { Link } from "react-router-dom";
import styles from "./NewListingPage.module.scss";

export default function NewListingPage() {
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.h1}>Додати оголошення</h1>
      <p className={styles.p}>
        Це сторінка створення оголошення. В MVP тут буде форма (або модалка),
        а поки що — заглушка, щоб роут працював і не падав у details.
      </p>

      <div className={styles.actions}>
        <Link className={styles.btn} to="/listings">
          Повернутись до пошуку
        </Link>
      </div>
    </div>
  );
}
