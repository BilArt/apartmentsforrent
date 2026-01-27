// src/pages/ListingDetailsPage/ListingDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { listingsApi } from "../../api/listings";
import { requestsApi } from "../../api/requests";

import styles from "./ListingDetailsPage.module.scss";

function getCityLabel(city) {
  if (typeof city === "string") return city;
  if (city && typeof city === "object") return city.nameUk || city.name || "—";
  return "—";
}

function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("uk-UA");
}

function getImages(listing) {
  const imgs = listing?.images;
  const list = Array.isArray(imgs) ? imgs : [];

  const pick = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.url) return val.url;
    return null;
  };

  const mapped = list.map(pick).filter(Boolean);

  const resolveSrc = (src) => {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    if (!src.startsWith("/")) return `/media/listings/${src}`;
    return src;
  };

  const resolved = mapped.map(resolveSrc).filter(Boolean);

  if (!resolved.length) return ["/media/listings/placeholder-1.jpg"];
  return resolved;
}

function getListingOwnerId(listing) {
  if (!listing || typeof listing !== "object") return null;

  const candidates = [
    listing.ownerId,
    listing.landlordId,
    listing.userId,
    listing.createdById,
    listing.owner?.id,
    listing.landlord?.id,
    listing.user?.id,
  ];

  const found = candidates.find(
    (v) => v !== undefined && v !== null && v !== ""
  );
  return found ? String(found) : null;
}

function statusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Очікує";
    case "APPROVED":
      return "Схвалено";
    case "REJECTED":
      return "Відхилено";
    case "COMPLETED":
      return "Завершено";
    default:
      return status || "—";
  }
}

function statusTone(status) {
  switch (status) {
    case "PENDING":
      return styles.badgePending;
    case "APPROVED":
      return styles.badgeApproved;
    case "REJECTED":
      return styles.badgeRejected;
    case "COMPLETED":
      return styles.badgeCompleted;
    default:
      return "";
  }
}

export default function ListingDetailsPage({ currentUser, onRequestViewing }) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [activeImg, setActiveImg] = useState(0);

  const [myReqStatus, setMyReqStatus] = useState("idle");
  const [myReqError, setMyReqError] = useState("");
  const [myRequest, setMyRequest] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const data = await listingsApi.getById(listingId);

        if (!alive) return;
        setItem(data);
        setStatus("ok");
        setActiveImg(0);
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError(e?.message || "Failed to load listing");
      }
    })();

    return () => {
      alive = false;
    };
  }, [listingId]);

  const backTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/listings";

  const title = item?.title || item?.address || "Оголошення";
  const cityLabel = useMemo(() => getCityLabel(item?.city), [item?.city]);
  const priceLabel = item ? `${formatPrice(item.price)} грн/міс.` : "";
  const images = useMemo(() => getImages(item), [item]);
  const mainImage = images[Math.min(activeImg, images.length - 1)];

  const isOwnListing = useMemo(() => {
    const uid = currentUser?.id ? String(currentUser.id) : null;
    const oid = getListingOwnerId(item);
    if (!uid || !oid) return false;
    return uid === oid;
  }, [currentUser, item]);

  const canCheckMyRequest = Boolean(currentUser?.id) && Boolean(item?.id);

  useEffect(() => {
    if (!canCheckMyRequest) return;
    if (isOwnListing) return;

    let alive = true;

    (async () => {
      try {
        setMyReqStatus("loading");
        setMyReqError("");
        setMyRequest(null);

        const myList = await requestsApi.getMy();
        if (!alive) return;

        const arr = Array.isArray(myList) ? myList : [];
        const found = arr.find((r) => String(r?.listingId) === String(item.id));

        setMyRequest(found || null);
        setMyReqStatus("ok");
      } catch (e) {
        if (!alive) return;

        const msg = e?.message || "Не вдалося перевірити заявку";
        // если сессия умерла — просто считаем, что "заявки нет"
        if (/not authenticated|unauthorized|401/i.test(String(msg))) {
          setMyRequest(null);
          setMyReqStatus("ok");
          setMyReqError("");
          return;
        }

        setMyReqStatus("error");
        setMyReqError(msg);
      }
    })();

    return () => {
      alive = false;
    };
  }, [canCheckMyRequest, isOwnListing, item?.id]);

  const hasMyRequest = Boolean(myRequest?.id);
  const myRequestLabel = hasMyRequest ? statusLabel(myRequest.status) : null;

  const goToRequests = () => {
    if (!item?.id) return;
    navigate(
      `/requests?tab=my&listingId=${encodeURIComponent(String(item.id))}`
    );
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(backTo)}
        >
          ← Назад
        </button>

        {status === "loading" && (
          <div className={styles.state}>Завантаження…</div>
        )}

        {status === "error" && (
          <div className={`${styles.state} ${styles.stateError}`}>
            Помилка завантаження: {error}
          </div>
        )}

        {status === "ok" && item && (
          <div className={styles.layout}>
            <div className={styles.left}>
              <div className={styles.galleryCard}>
                <div className={styles.galleryMain}>
                  <img src={mainImage} alt={title} className={styles.mainImg} />
                </div>

                {images.length > 1 && (
                  <div
                    className={styles.thumbs}
                    role="tablist"
                    aria-label="Photos"
                  >
                    {images.slice(0, 6).map((src, idx) => {
                      const isActive = idx === activeImg;
                      return (
                        <button
                          key={`${src}-${idx}`}
                          type="button"
                          className={
                            isActive ? styles.thumbBtnActive : styles.thumbBtn
                          }
                          onClick={() => setActiveImg(idx)}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <img src={src} alt="" className={styles.thumbImg} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.mainCard}>
                <div className={styles.headerRow}>
                  <div>
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.subtitle}>
                      {cityLabel}
                      {item.address ? ` • ${item.address}` : ""}
                    </div>
                  </div>

                  <div className={styles.price}>{priceLabel}</div>
                </div>

                <div className={styles.divider} />

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Орендодавець</div>
                    <div className={styles.metaValue}>
                      {item.landlordName || "—"}
                      {typeof item.landlordRating === "number"
                        ? ` (Рейтинг: ${item.landlordRating})`
                        : ""}
                    </div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Місто</div>
                    <div className={styles.metaValue}>{cityLabel}</div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Адреса</div>
                    <div className={styles.metaValue}>
                      {item.address || "—"}
                    </div>
                  </div>

                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>ID</div>
                    <div className={styles.metaValue}>{item.id}</div>
                  </div>

                  {typeof item.rooms === "number" && item.rooms > 0 ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Кімнати</div>
                      <div className={styles.metaValue}>{item.rooms}</div>
                    </div>
                  ) : null}

                  {typeof item.area === "number" && item.area > 0 ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Метраж</div>
                      <div className={styles.metaValue}>{item.area} м2</div>
                    </div>
                  ) : null}

                  {item.availableFrom ? (
                    <div className={styles.metaItem}>
                      <div className={styles.metaLabel}>Доступно від</div>
                      <div className={styles.metaValue}>
                        {String(item.availableFrom)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {item.description ? (
                  <>
                    <div className={styles.divider} />
                    <h2 className={styles.h2}>Опис</h2>
                    <p className={styles.desc}>{item.description}</p>
                  </>
                ) : null}
              </div>
            </div>

            <aside className={styles.right}>
              <div className={styles.sideCard}>
                <div className={styles.sideTitle}>Швидкі дії</div>

                <button type="button" className={styles.primaryBtn} disabled>
                  Написати орендодавцю
                </button>

                {!isOwnListing ? (
                  <>
                    {currentUser && (
                      <div className={styles.requestStatus}>
                        <div className={styles.requestStatusLabel}>
                          Статус заявки
                        </div>

                        {myReqStatus === "loading" ? (
                          <div className={styles.requestStatusValue}>
                            Перевіряємо…
                          </div>
                        ) : myReqStatus === "error" ? (
                          <div className={styles.requestStatusValueError}>
                            {myReqError || "Помилка перевірки"}
                          </div>
                        ) : hasMyRequest ? (
                          <div className={styles.requestStatusValueRow}>
                            <span
                              className={`${styles.badge} ${statusTone(
                                myRequest?.status
                              )}`}
                            >
                              {myRequestLabel}
                            </span>
                            <span className={styles.requestStatusHint}>
                              Твоя заявка на перегляд
                            </span>
                          </div>
                        ) : (
                          <div className={styles.requestStatusValueMuted}>
                            Заявки ще немає
                          </div>
                        )}
                      </div>
                    )}

                    {hasMyRequest ? (
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={goToRequests}
                        disabled={!item?.id}
                      >
                        Перейти до заявок
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => onRequestViewing?.(item?.id)}
                        disabled={!item?.id}
                      >
                        Запросити перегляд
                      </button>
                    )}

                    <div className={styles.sideNote}>
                      (Чат підключимо пізніше. Зараз головне — заявка і статус.)
                    </div>
                  </>
                ) : (
                  <div className={styles.sideNote}>
                    Це ваше оголошення — ви не можете надсилати запит на
                    перегляд самому собі.
                  </div>
                )}
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideTitle}>Безпека</div>
                <ul className={styles.bullets}>
                  <li>Підтверджена особа через BankID</li>
                  <li>Рейтинг орендодавця без “обнулення”</li>
                  <li>Прозорі умови угоди</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
