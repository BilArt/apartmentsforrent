import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { listingsApi } from "../../api/listings";
import { requestsApi } from "../../api/requests";
import { API_BASE_URL } from "../../api/config";

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

function formatDateOnly(value) {
  if (!value) return "—";

  const d =
    value instanceof Date
      ? value
      : new Date(
          typeof value === "string" || typeof value === "number" ? value : "",
        );

  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function resolveMediaUrl(src) {
  if (!src) return null;

  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${API_BASE_URL}${src}`;
  return `${API_BASE_URL}/media/listings/${src}`;
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
  const resolved = mapped.map(resolveMediaUrl).filter(Boolean);

  return resolved;
}

function buildFeatures(listing) {
  const f = listing?.features || listing;

  const items = [
    { key: "kitchen", label: "Окрема кухня", on: Boolean(f?.kitchen) },
    { key: "balcony", label: "Балкон", on: Boolean(f?.balcony) },
    { key: "pets", label: "Тварини", on: Boolean(f?.pets) },
    { key: "lift", label: "Ліфт", on: Boolean(f?.lift) },
    { key: "parking", label: "Паркінг", on: Boolean(f?.parking) },
    { key: "furnished", label: "З меблями", on: Boolean(f?.furnished) },
    { key: "storage", label: "Комора", on: Boolean(f?.storage) },
  ];

  return items.filter((x) => x.on);
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
    (v) => v !== undefined && v !== null && v !== "",
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
  const [imageBroken, setImageBroken] = useState(false);

  const [myReqStatus, setMyReqStatus] = useState("idle");
  const [myReqError, setMyReqError] = useState("");
  const [myRequest, setMyRequest] = useState(null);

  const refreshGuardRef = useRef({ inFlight: false, lastAt: 0 });

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
        setImageBroken(false);
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
  const hasImages = images.length > 0;

  const safeActive = Math.min(activeImg, Math.max(images.length - 1, 0));
  const mainImage = hasImages ? images[safeActive] : null;

  const features = useMemo(() => buildFeatures(item), [item]);

  const availableFromLabel = useMemo(
    () => formatDateOnly(item?.availableFrom),
    [item?.availableFrom],
  );

  const ownerId = useMemo(() => getListingOwnerId(item), [item]);

  const isOwnListing = useMemo(() => {
    const uid = currentUser?.id ? String(currentUser.id) : null;
    const oid = ownerId;
    if (!uid || !oid) return false;
    return uid === oid;
  }, [currentUser, ownerId]);

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
  }, [canCheckMyRequest, isOwnListing, item?.id, currentUser?.id]);

  useEffect(() => {
    if (!item?.id) return;

    const doRefreshMyRequest = () => {
      const now = Date.now();
      const guard = refreshGuardRef.current;

      if (guard.inFlight) return;
      if (now - guard.lastAt < 600) return;

      guard.inFlight = true;
      guard.lastAt = now;

      requestsApi
        .getMy()
        .then((myList) => {
          const arr = Array.isArray(myList) ? myList : [];
          const found = arr.find(
            (r) => String(r?.listingId) === String(item.id),
          );
          setMyRequest(found || null);
          setMyReqStatus("ok");
          setMyReqError("");
        })
        .catch((err) => {
          const msg = err?.message || "Не вдалося оновити заявку";
          if (/not authenticated|unauthorized|401/i.test(String(msg))) return;
          setMyReqError(msg);
        })
        .finally(() => {
          refreshGuardRef.current.inFlight = false;
        });
    };

    const handler = (e) => {
      const d = e?.detail;
      if (!d) return;
      if (String(d.listingId) !== String(item.id)) return;

      if (e.type === "requestCreated") {
        setMyReqStatus("ok");
        setMyReqError("");

        setMyRequest((prev) => {
          if (prev?.listingId && String(prev.listingId) === String(item.id))
            return prev;
          return {
            id: d.requestId ? String(d.requestId) : undefined,
            listingId: String(item.id),
            status: d.status || "PENDING",
          };
        });

        doRefreshMyRequest();
        return;
      }

      if (e.type === "requestStatusChanged") {
        setMyReqStatus("ok");
        setMyReqError("");

        setMyRequest((prev) => {
          if (!prev) {
            return {
              listingId: String(item.id),
              status: d.status,
              id: d.requestId ? String(d.requestId) : undefined,
            };
          }
          if (String(prev.listingId) !== String(item.id)) return prev;
          return { ...prev, status: d.status };
        });

        doRefreshMyRequest();
      }
    };

    window.addEventListener("requestCreated", handler);
    window.addEventListener("requestStatusChanged", handler);

    return () => {
      window.removeEventListener("requestCreated", handler);
      window.removeEventListener("requestStatusChanged", handler);
    };
  }, [item?.id]);

  const hasMyRequest =
    Boolean(myRequest?.listingId) &&
    String(myRequest.listingId) === String(item?.id);

  const myRequestLabel = hasMyRequest ? statusLabel(myRequest.status) : null;

  const goToRequests = () => {
    if (!item?.id) return;
    navigate(
      `/requests?tab=my&listingId=${encodeURIComponent(String(item.id))}`,
    );
  };

  const openChat = () => {
    if (!item?.id) return;
    navigate(`/chat?listingId=${encodeURIComponent(String(item.id))}`, {
      state: { from: location },
    });
  };

  const onMainImgError = () => setImageBroken(true);

  const landlordTitle = useMemo(() => {
    const name = item?.landlordName ? String(item.landlordName) : "";
    const rating =
      typeof item?.landlordRating === "number" ? item.landlordRating : null;

    if (!name && rating === null) return "—";
    if (!name && rating !== null) return `— (Рейтинг: ${rating})`;
    if (name && rating === null) return name;
    return `${name} (Рейтинг: ${rating})`;
  }, [item?.landlordName, item?.landlordRating]);

  const canOpenOwner = Boolean(ownerId) && !isOwnListing;

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
                  {!hasImages || imageBroken ? (
                    <div className={styles.noPhoto}>Фото нема</div>
                  ) : (
                    <img
                      src={mainImage}
                      alt={title}
                      className={styles.mainImg}
                      onError={onMainImgError}
                    />
                  )}
                </div>

                {hasImages && images.length > 1 && (
                  <div
                    className={styles.thumbs}
                    role="tablist"
                    aria-label="Photos"
                  >
                    {images.slice(0, 6).map((src, idx) => {
                      const isActive = idx === safeActive;
                      return (
                        <button
                          key={`${src}-${idx}`}
                          type="button"
                          className={
                            isActive ? styles.thumbBtnActive : styles.thumbBtn
                          }
                          onClick={() => {
                            setActiveImg(idx);
                            setImageBroken(false);
                          }}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <img src={src} alt="" className={styles.thumbImg} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideTitle}>Швидкі дії</div>

                {!isOwnListing ? (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={openChat}
                    disabled={!item?.id}
                  >
                    Написати орендодавцю
                  </button>
                ) : (
                  <button type="button" className={styles.primaryBtn} disabled>
                    Це ваше оголошення
                  </button>
                )}

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
                              className={`${styles.badge} ${statusTone(myRequest?.status)}`}
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
                      (Чат — MVP. Поки що базова переписка, без “космоса”.)
                    </div>
                  </>
                ) : (
                  <div className={styles.sideNote}>
                    Це ваше оголошення — ви не можете писати самому собі.
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
            </div>

            <div className={styles.right}>
              <div className={styles.mainCard}>
                <div className={styles.headerRow}>
                  <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.subtitle}>
                      {cityLabel}
                      {item.address ? ` • ${item.address}` : ""}
                    </div>
                  </div>

                  <div className={styles.price}>{priceLabel}</div>
                </div>

                {features.length > 0 && (
                  <div className={styles.features} aria-label="Features">
                    {features.slice(0, 6).map((f) => (
                      <span key={f.key} className={styles.featurePill}>
                        {f.label}
                      </span>
                    ))}
                    {features.length > 6 && (
                      <span
                        className={`${styles.featurePill} ${styles.featureMore}`}
                      >
                        +{features.length - 6}
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Орендодавець</div>

                    <div className={styles.metaValue}>
                      {canOpenOwner ? (
                        <Link
                          to={`/users/${encodeURIComponent(ownerId)}`}
                          state={{ from: location }}
                          className={styles.ownerLink}
                          title="Відкрити профіль орендодавця"
                        >
                          {landlordTitle}
                        </Link>
                      ) : (
                        landlordTitle
                      )}

                      {!ownerId && (
                        <span className={styles.ownerHint}>
                          (нема id — бэкенд не віддав)
                        </span>
                      )}
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
                        {availableFromLabel}
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
          </div>
        )}
      </div>
    </div>
  );
}
