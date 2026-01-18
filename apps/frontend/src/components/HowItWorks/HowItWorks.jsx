import { useState } from "react";
import styles from "./HowItWorks.module.scss";

import howImg from "../../assets/images/howitworks.jpg";
import { AnimatePresence, motion as Motion } from "framer-motion";

const steps = [
  {
    id: 1,
    tab: "КРОК 1",
    title: "Перегляньте наші пропозиції квартир та ознайомтеся з ними особисто",
    text:
      "Виберіть квартиру, яка найкраще відповідає вашим потребам, на нашому вебсайті. " +
      "Наш консультант із задоволенням проведе вас по квартирі та покаже район, де ви незабаром будете жити.",
  },
  {
    id: 2,
    tab: "КРОК 2",
    title: "Подайте заявку онлайн",
    text:
      "Заповніть коротку форму: контактні дані, бажані дати та базова інформація. " +
      "Ми зв’яжемося з вами для підтвердження деталей.",
  },
  {
    id: 3,
    tab: "КРОК 3",
    title: "Підпишіть договір",
    text:
      "Отримайте прозорий договір оренди, перевірте умови та підпишіть онлайн. " +
      "Жодних сюрпризів — тільки чіткі правила.",
  },
  {
    id: 4,
    tab: "КРОК 4",
    title: "Заселяйтеся та керуйте орендою в кабінеті",
    text:
      "Заселяйтеся у вибране житло та керуйте платежами/заявками на сервіс у вашому профілі. " +
      "Все під рукою — швидко і зручно.",
  },
];

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function HowItWorks() {
  const [active, setActive] = useState(1);
  const [direction, setDirection] = useState(0);

  const current = steps.find((s) => s.id === active) ?? steps[0];

  const changeStep = (id) => {
    if (id === active) return;
    setDirection(id > active ? 1 : -1);
    setActive(id);
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.media}>
            <img
              className={styles.image}
              src={howImg}
              alt="Інтер’єр квартири"
              loading="lazy"
            />
          </div>

          <div className={styles.content}>
            <h2 className={styles.title}>
              <span className={styles.titleAccent}>Як</span> це працює?
            </h2>

            <p className={styles.subtitle}>4 простих кроки до оренди:</p>

            <div
              className={styles.tabs}
              role="tablist"
              aria-label="Кроки оренди"
            >
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => changeStep(step.id)}
                  className={styles.tab}
                  type="button"
                >
                  {step.tab}

                  {active === step.id && (
                    <Motion.div
                      layoutId="active-underline"
                      className={styles.underline}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className={styles.stepViewport}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <Motion.div
                  key={current.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className={styles.step}
                >
                  <h3 className={styles.stepTitle}>{current.title}</h3>
                  <p className={styles.stepText}>{current.text}</p>
                </Motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
