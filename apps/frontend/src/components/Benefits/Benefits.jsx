import { createElement } from "react";
import styles from "./Benefits.module.scss";

import ChatIcon from "../../assets/svg/chat.svg?react";
import ShieldIcon from "../../assets/svg/shield.svg?react";
import StarIcon from "../../assets/svg/star.svg?react";
import KeyIcon from "../../assets/svg/key.svg?react";

const items = [
  {
    id: "chat",
    icon: ChatIcon,
    text: "Чесні відгуки від\nпідтверджених користувачів",
  },
  { id: "shield", icon: ShieldIcon, text: "Захист обох сторін угоди" },
  {
    id: "star",
    icon: StarIcon,
    text: "Єдиний рейтинг, який\nнеможливо «обнулити»",
  },
  { id: "key", icon: KeyIcon, text: "Прозора та зручна система\nоренди" },
];

export default function Benefits() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.left}>
            <h2 className={styles.title}>
              Безпечне майбутнє <br />з <span className={styles.brand}>Nø</span>
              RESET
            </h2>

            <p className={styles.text}>
              Ми хочемо бути вашим довгостроковим партнером, з яким ви можете
              спокійно планувати своє майбутнє. Чіткий договір і система
              управління орендою та додатковими послугами: на це ви можете
              розраховувати, обираючи NoReset. У наших апартаментах ви
              почуватиметесь як вдома — переконайтеся самі.
            </p>
          </div>

          <div className={styles.right}>
            <ul className={styles.cards}>
              {items.map((item) => (
                <li key={item.id} className={styles.card}>
                  <div className={styles.iconCircle}>
                    {createElement(item.icon, {
                      className: styles.icon,
                      "aria-hidden": true,
                    })}
                  </div>

                  <p className={styles.cardText}>
                    {item.text.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
