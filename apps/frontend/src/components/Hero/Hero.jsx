import styles from "./Hero.module.scss";
import SearchBar from "../SearchBar/SearchBar.jsx";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.inner}>
          <h1 className={styles.title}>Прозора оренда житла онлайн</h1>

          <p className={styles.subtitle}>
            Реальні люди.{" "}
            <span className={styles.accent}>Реальні відгуки.</span> Реальна
            репутація.
          </p>

          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}
