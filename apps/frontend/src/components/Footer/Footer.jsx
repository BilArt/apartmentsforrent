import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
      { label: "Про нас", to: "/about", kind: "route" },
      { label: "Як це працює", to: "/how-it-works", kind: "route" },
      { label: "BankID", to: "/bankid", kind: "route" },
      { label: "Рейтинг", to: "/rating", kind: "route" },
    ],
  },
  {
    title: "Контакти та підтримка",
    links: [
      { label: "Підтримка", kind: "support" },
      { label: "Повідомити про проблему", kind: "report" },
    ],
  },
];

const LEGAL_COLUMNS = [
  {
    title: "Юридично",
    links: [
      { label: "Угода", kind: "legal_terms" },
      { label: "Конфіденційність", kind: "legal_privacy" },
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

function SupportForm({ topic, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const isValid = email.trim() && message.trim().length >= 10;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;

        onSubmit({
          topic,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        });
      }}
    >
      <div className={styles.formRow}>
        <label className={styles.label}>
          Імʼя (необовʼязково)
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Артем"
          />
        </label>

        <label className={styles.label}>
          Email *
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            type="email"
          />
        </label>
      </div>

      <label className={styles.label}>
        Повідомлення *
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            topic === "support"
              ? "Опиши, що сталося, і що ти очікував(ла) побачити."
              : "Опиши кроки, як відтворити проблему: 1) ... 2) ... 3) ..."
          }
          rows={6}
        />
      </label>

      <div className={styles.formHint}>
        Мінімум 10 символів у повідомленні. Так, ми не приймаємо “не працює” як
        технічний опис 😄
      </div>

      <button className={styles.formBtn} type="submit" disabled={!isValid}>
        Надіслати
      </button>
    </form>
  );
}

export default function Footer() {
  const location = useLocation();
  const [modal, setModal] = useState(null);

  const closeModal = () => setModal(null);

  const legalText = useMemo(() => {
    const terms = {
      title: "Угода користувача",
      text: (
        <>
          <p className={styles.infoP}>
            Apartmentsforrent — це платформа для пошуку та розміщення оголошень
            оренди житла і комунікації між орендарем та орендодавцем. На етапі
            MVP ми робимо акцент на прозорості, безпеці та відповідальності
            сторін.
          </p>

          <h3 className={styles.infoH3}>1) Роль платформи</h3>
          <p className={styles.infoP}>
            Ми не є стороною договору оренди. Платформа надає інструменти:
            профіль, перевірку особи, обмін повідомленнями, заявки, базові умови
            договору та механіку рейтингу.
          </p>

          <h3 className={styles.infoH3}>2) BankID та перевірка особи</h3>
          <p className={styles.infoP}>
            Користувач може підтвердити особу через BankID. Це підвищує довіру
            та впливає на видимість профілю й рейтинг. Якщо перевірка не
            пройдена, частина функцій може бути обмежена.
          </p>

          <h3 className={styles.infoH3}>3) Договір та підпис</h3>
          <p className={styles.infoP}>
            У фінальній версії платформа формує проєкт контракту та надсилає
            його обом сторонам на підтвердження. Після погодження умов можливий
            цифровий підпис (провайдер підпису буде визначено окремо). У MVP це
            описаний процес і шаблон.
          </p>

          <h3 className={styles.infoH3}>4) Відповідальність</h3>
          <p className={styles.infoP}>
            Користувачі несуть відповідальність за достовірність даних у профілі
            та оголошеннях. Заборонено шахрайство, фейкові оголошення, вимагання
            передоплат “в нікуди” та підміна особи.
          </p>
        </>
      ),
    };

    const privacy = {
      title: "Конфіденційність",
      text: (
        <>
          <p className={styles.infoP}>
            Ми збираємо лише те, що потрібно для роботи сервісу: контактні дані,
            дані профілю, технічну аналітику та (за згодою) факт проходження
            BankID-верифікації.
          </p>

          <h3 className={styles.infoH3}>Що зберігаємо</h3>
          <ul className={styles.infoUl}>
            <li>імʼя/нікнейм, email/телефон;</li>
            <li>ідентифікатор користувача, технічні логи (помилки, події);</li>
            <li>
              статус верифікації (підтверджено/не підтверджено) — без зайвих
              деталей.
            </li>
          </ul>

          <h3 className={styles.infoH3}>Що НЕ робимо</h3>
          <ul className={styles.infoUl}>
            <li>не продаємо дані третім сторонам;</li>
            <li>не публікуємо приватні контакти без твоєї дії (заявки/чат);</li>
            <li>не зберігаємо “надлишкові” банківські дані.</li>
          </ul>

          <h3 className={styles.infoH3}>Видалення даних</h3>
          <p className={styles.infoP}>
            У фінальній версії буде механіка “видалити акаунт” та експорт даних.
            У MVP — через запит у підтримку.
          </p>
        </>
      ),
    };

    return { terms, privacy };
  }, []);

  const openSupport = () => setModal({ type: "support", title: "Підтримка" });
  const openReport = () =>
    setModal({ type: "report", title: "Повідомити про проблему" });
  const openLegalTerms = () =>
    setModal({ type: "legal_terms", title: legalText.terms.title });
  const openLegalPrivacy = () =>
    setModal({ type: "legal_privacy", title: legalText.privacy.title });

  const renderLink = (link) => {
    if (link.kind === "route" && link.to) {
      return (
        <Link className={styles.link} to={link.to} state={{ from: location }}>
          {link.label}
        </Link>
      );
    }

    const onClickMap = {
      support: openSupport,
      report: openReport,
      legal_terms: openLegalTerms,
      legal_privacy: openLegalPrivacy,
    };

    const handler = onClickMap[link.kind];

    return (
      <button type="button" className={styles.linkBtn} onClick={handler}>
        {link.label}
      </button>
    );
  };

  const handleSend = ({ topic }) => {
    setModal({
      type: "sent",
      title: "Надіслано",
      payload: { topic },
    });
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
              className={styles.colSupport}
              title={TOP_COLUMNS[1].title}
              links={TOP_COLUMNS[1].links}
              renderLink={renderLink}
            />

            <LinksColumn
              styles={styles}
              className={styles.colLegal}
              title={LEGAL_COLUMNS[0].title}
              links={LEGAL_COLUMNS[0].links}
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
        </div>

        <div className={styles.copy}>© 2026 NoReset. Всі права захищені.</div>
      </footer>

      {modal ? (
        <Modal title={modal.title} onClose={closeModal}>
          {modal.type === "support" ? (
            <SupportForm topic="support" onSubmit={handleSend} />
          ) : null}

          {modal.type === "report" ? (
            <SupportForm topic="report" onSubmit={handleSend} />
          ) : null}

          {modal.type === "legal_terms" ? (
            <div className={styles.infoModalText}>{legalText.terms.text}</div>
          ) : null}

          {modal.type === "legal_privacy" ? (
            <div className={styles.infoModalText}>{legalText.privacy.text}</div>
          ) : null}

          {modal.type === "sent" ? (
            <div className={styles.infoModalText}>
              <p className={styles.infoP}>
                Дякую! Повідомлення прийнято. У MVP ми не відправляємо реальні
                листи автоматично, але структура форми вже готова під
                інтеграцію.
              </p>
              <p className={styles.infoP}>
                Наступний крок: підключити бекенд-ендпоінт або mail-сервіс
                (nodemailer/провайдер).
              </p>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
