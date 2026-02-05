import styles from "./HowItWorksPage.module.scss";

export default function HowItWorksPage() {
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.h1}>Як це працює</h1>

      <div className={styles.steps}>
        <div className={styles.card}>
          <div className={styles.title}>1) Пошук</div>
          <p className={styles.p}>
            Обираєш місто, дати та фільтри. Ми показуємо релевантні оголошення з
            прозорими умовами: ціна, правила, зручності, фото, рейтинг власника.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.title}>2) Заявка</div>
          <p className={styles.p}>
            Надсилаєш заявку власнику. Власник або підтверджує, або відхиляє. В
            MVP ми вже контролюємо “race condition”: дві людини не зможуть
            одночасно отримати один і той самий активний контракт.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.title}>3) Перевірка</div>
          <p className={styles.p}>
            BankID підвищує довіру. Підтверджені користувачі отримують кращу
            видимість, менше обмежень і сильніший профіль.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.title}>4) Контракт і завершення</div>
          <p className={styles.p}>
            У фінальній версії: контракт формується, погоджується та
            підписується цифрово. Після завершення взаємодії сторони залишають
            відгук — це й будує репутацію.
          </p>
        </div>
      </div>
    </div>
  );
}
