import styles from "./Footer.module.scss";

import InstagramIcon from "../../assets/svg/instagram.svg?react";
import FacebookIcon from "../../assets/svg/facebook.svg?react";
import YoutubeIcon from "../../assets/svg/youtube.svg?react";
import TiktokIcon from "../../assets/svg/tiktok.svg?react";

const topColumns = [
  { title: "Про платформу", links: ["Про нас", "Як це працює", "BankID"] },
  {
    title: "Нерухомість",
    links: ["Пошук житла", "Фільтри", "Додати оголошення"],
  },
  {
    title: "Підтримка",
    links: ["Допомога", "Підтримка", "Повідомити про проблему"],
  },
];

const bottomColumns = [
  {
    title: "Користувачам",
    links: ["Орендодавцям", "Орендарям", "Типи акаунтів", "Рейтинг"],
  },
  { title: "Відгуки та безпека", links: ["Відгуки", "Правила", "Безпека"] },
  { title: "Юридично", links: ["Угода", "Конфіденційність"] },
];

const social = [
  { id: "ig", label: "Instagram", icon: InstagramIcon, href: "#" },
  { id: "fb", label: "Facebook", icon: FacebookIcon, href: "#" },
  { id: "yt", label: "YouTube", icon: YoutubeIcon, href: "#" },
  { id: "tt", label: "TikTok", icon: TiktokIcon, href: "#" },
];

function LinksColumn({ title, links }) {
  return (
    <div className={styles.col}>
      <div className={styles.colTitle}>{title}</div>
      <ul className={styles.list}>
        {links.map((t) => (
          <li key={t}>
            <a className={styles.link} href="#">
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          <a href="/" className={styles.logo} aria-label="NoReset home">
            <span className={styles.logoAccent}>Nø</span>RESET
          </a>

          {topColumns.map((c) => (
            <LinksColumn key={c.title} title={c.title} links={c.links} />
          ))}

          <div className={styles.col}>
            <div className={styles.colTitle}>Наші соціальні мережі</div>

            <div className={styles.social}>
              {social.map(({ id, icon, label, href }) => {
                const SocialIcon = icon;
                return (
                  <a
                    key={id}
                    href={href}
                    className={styles.socialBtn}
                    aria-label={label}
                  >
                    <SocialIcon
                      className={styles.socialIcon}
                      aria-hidden="true"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div aria-hidden="true" />
          {bottomColumns.map((c) => (
            <LinksColumn key={c.title} title={c.title} links={c.links} />
          ))}
          <div aria-hidden="true" />
        </div>
      </div>

      <div className={styles.copy}>© 2026 NoReset. Всі права захищені.</div>
    </footer>
  );
}
