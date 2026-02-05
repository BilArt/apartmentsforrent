import { useState } from "react";
import { Link } from "react-router-dom";

import styles from "./Footer.module.scss";
import Modal from "../Modal/Modal";

import InstagramIcon from "../../assets/svg/instagram.svg?react";
import FacebookIcon from "../../assets/svg/facebook.svg?react";
import YoutubeIcon from "../../assets/svg/youtube.svg?react";
import TiktokIcon from "../../assets/svg/tiktok.svg?react";

const SOCIAL = [
  { id: "ig", label: "Instagram", icon: InstagramIcon, href: "#" },
  { id: "fb", label: "Facebook", icon: FacebookIcon, href: "#" },
  { id: "yt", label: "YouTube", icon: YoutubeIcon, href: "#" },
  { id: "tt", label: "TikTok", icon: TiktokIcon, href: "#" },
];

const TOP_COLUMNS = [
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
];

const BOTTOM_COLUMNS = [
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
];

function LinksColumn({ title, links, className, renderLink, styles }) {
  return (
    <div className={`${styles.col} ${className || ""}`}>
      <div className={styles.colTitle}>{title}</div>
      <ul className={styles.list}>
        {links.map((l) => (
          <li key={l.label}>{renderLink(l)}</li>
        ))}
      </ul>
    </div>
  );
}

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

  return (
    <>
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.topGrid}>
            <div className={styles.brandCol}>
              <Link to="/" className={styles.logo} aria-label="NoReset home">
                <span className={styles.logoAccent}>Nø</span>RESET
              </Link>
            </div>

            <LinksColumn
              styles={styles}
              className={styles.colPlatform}
              title={TOP_COLUMNS[0].title}
              links={TOP_COLUMNS[0].links}
              renderLink={renderLink}
            />
            <LinksColumn
              styles={styles}
              className={styles.colEstate}
              title={TOP_COLUMNS[1].title}
              links={TOP_COLUMNS[1].links}
              renderLink={renderLink}
            />
            <LinksColumn
              styles={styles}
              className={styles.colSupport}
              title={TOP_COLUMNS[2].title}
              links={TOP_COLUMNS[2].links}
              renderLink={renderLink}
            />

            <div className={`${styles.col} ${styles.socialCol}`}>
              <div className={styles.colTitle}>Наші соціальні мережі</div>

              <div className={styles.social}>
                {SOCIAL.map(({ id, icon, label, href }) => {
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
            <div className={styles.bottomSpacer} aria-hidden="true" />

            <LinksColumn
              styles={styles}
              className={styles.colUsers}
              title={BOTTOM_COLUMNS[0].title}
              links={BOTTOM_COLUMNS[0].links}
              renderLink={renderLink}
            />
            <LinksColumn
              styles={styles}
              className={styles.colReviews}
              title={BOTTOM_COLUMNS[1].title}
              links={BOTTOM_COLUMNS[1].links}
              renderLink={renderLink}
            />
            <LinksColumn
              styles={styles}
              className={styles.colLegal}
              title={BOTTOM_COLUMNS[2].title}
              links={BOTTOM_COLUMNS[2].links}
              renderLink={renderLink}
            />

            <div className={styles.bottomSpacer} aria-hidden="true" />
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
