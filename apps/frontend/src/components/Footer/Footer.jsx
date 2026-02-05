import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import styles from "./Footer.module.scss";
import Modal from "../Modal/Modal";

import InstagramIcon from "../../assets/svg/instagram.svg?react";
import FacebookIcon from "../../assets/svg/facebook.svg?react";
import YoutubeIcon from "../../assets/svg/youtube.svg?react";
import TiktokIcon from "../../assets/svg/tiktok.svg?react";

const social = [
  { id: "ig", label: "Instagram", icon: InstagramIcon, href: "#" },
  { id: "fb", label: "Facebook", icon: FacebookIcon, href: "#" },
  { id: "yt", label: "YouTube", icon: YoutubeIcon, href: "#" },
  { id: "tt", label: "TikTok", icon: TiktokIcon, href: "#" },
];

export default function Footer() {
  const [info, setInfo] = useState(null);

  const openInfo = (title) => {
    setInfo({
      title,
      text:
        "Цей розділ поки що у форматі інформаційної заглушки для MVP. " +
        "У фінальній версії тут буде окрема сторінка з деталями.",
    });
  };

  const closeInfo = () => setInfo(null);

  const topColumns = useMemo(
    () => [
      {
        title: "Про платформу",
        links: [
          { label: "Про нас", to: "/", kind: "route" },
          { label: "Як це працює", to: "/#how-it-works", kind: "route" },
          { label: "BankID", kind: "modal" },
        ],
      },
      {
        title: "Нерухомість",
        links: [
          { label: "Пошук житла", to: "/listings", kind: "route" },
          { label: "Фільтри", kind: "modal" },
          { label: "Додати оголошення", kind: "modal" },
        ],
      },
      {
        title: "Підтримка",
        links: [
          { label: "Допомога", kind: "modal" },
          { label: "Підтримка", kind: "modal" },
          { label: "Повідомити про проблему", kind: "modal" },
        ],
      },
    ],
    [],
  );

  const bottomColumns = useMemo(
    () => [
      {
        title: "Користувачам",
        links: [
          { label: "Орендодавцям", kind: "modal" },
          { label: "Орендарям", kind: "modal" },
          { label: "Рейтинг", kind: "modal" },
        ],
      },
      {
        title: "Відгуки та безпека",
        links: [
          { label: "Відгуки", kind: "modal" },
          { label: "Правила", kind: "modal" },
          { label: "Безпека", kind: "modal" },
        ],
      },
      {
        title: "Юридично",
        links: [
          { label: "Угода", kind: "modal" },
          { label: "Конфіденційність", kind: "modal" },
        ],
      },
    ],
    [],
  );

  const renderLink = (link) => {
    if (link.kind === "route" && link.to) {
      return (
        <Link className={styles.link} to={link.to}>
          {link.label}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={styles.linkBtn}
        onClick={() => openInfo(link.label)}
      >
        {link.label}
      </button>
    );
  };

  function LinksColumn({ title, links }) {
    return (
      <div className={styles.col}>
        <div className={styles.colTitle}>{title}</div>
        <ul className={styles.list}>
          {links.map((l) => (
            <li key={l.label}>{renderLink(l)}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.topGrid}>
            <Link to="/" className={styles.logo} aria-label="NoReset home">
              <span className={styles.logoAccent}>Nø</span>RESET
            </Link>

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

      {info ? (
        <Modal title={info.title} onClose={closeInfo}>
          <div className={styles.infoModalText}>{info.text}</div>
        </Modal>
      ) : null}
    </>
  );
}
