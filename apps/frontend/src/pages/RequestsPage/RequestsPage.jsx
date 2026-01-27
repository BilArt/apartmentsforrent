import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestsApi } from "../../api/requests";
import { authApi } from "../../api/auth";
import styles from "./RequestsPage.module.scss";

function formatUaDateFromIso(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  return `${m[3]}.${m[2]}.${m[1]}`;
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

function getPersonName(user) {
  if (!user) return "—";
  const first = user.firstName || "";
  const last = user.lastName || "";
  const s = `${first} ${last}`.trim();
  return s || "—";
}

export default function RequestsPage({
  currentUser,
  authLoading,
  onRequireAuth,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlListingId = searchParams.get("listingId");
  const urlTab = searchParams.get("tab");

  const [sessionUser, setSessionUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const effectiveUser = currentUser || sessionUser;
  const effectiveAuthLoading = authLoading || sessionLoading;

  const isAuthed = !effectiveAuthLoading && Boolean(effectiveUser);

  const [tab, setTab] = useState("incoming");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [my, setMy] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [actionErrors, setActionErrors] = useState({});

  useEffect(() => {
    if (urlListingId) {
      if (tab !== "incoming") setTab("incoming");
      if (urlTab !== "incoming") {
        const next = new URLSearchParams(searchParams);
        next.set("tab", "incoming");
        setSearchParams(next, { replace: true });
      }
      return;
    }

    if (urlTab === "my" || urlTab === "incoming") {
      if (tab !== urlTab) setTab(urlTab);
    }
  }, [urlListingId, urlTab]);

  const incomingCount = incoming?.length || 0;
  const myCount = my?.length || 0;

  const tabsDisabled = effectiveAuthLoading || !isAuthed;

  const refresh = async () => {
    setLoading(true);
    setError("");

    try {
      const [myData, incomingData] = await Promise.all([
        requestsApi.getMy(),
        requestsApi.getIncoming(),
      ]);

      setMy(Array.isArray(myData) ? myData : []);
      setIncoming(Array.isArray(incomingData) ? incomingData : []);
    } catch (e) {
      const msg = e?.message || "Не вдалося завантажити заявки";
      if (/not authenticated|unauthorized|401/i.test(String(msg))) {
        setError("Схоже, твоя сесія закінчилась. Увійди ще раз.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (currentUser) return;

    let alive = true;

    setSessionLoading(true);
    authApi
      .me()
      .then((u) => {
        if (!alive) return;
        setSessionUser(u || null);
      })
      .catch(() => {
        if (!alive) return;
        setSessionUser(null);
      })
      .finally(() => {
        if (!alive) return;
        setSessionLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [authLoading, currentUser]);

  useEffect(() => {
    if (effectiveAuthLoading) return;
    if (!isAuthed) return;
    refresh();
  }, [effectiveAuthLoading, isAuthed]);

  const onChangeStatus = async (requestId, newStatus) => {
    if (!requestId) return;

    setUpdatingIds((prev) => new Set(prev).add(requestId));
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });

    try {
      const updated = await requestsApi.updateStatus(requestId, newStatus);

      const applyUpdated = (arr) =>
        arr.map((r) => (r.id === requestId ? updated : r));

      setIncoming((prev) => applyUpdated(prev));
      setMy((prev) => applyUpdated(prev));
    } catch (e) {
      const msg = e?.message || "Не вдалося оновити статус";
      setActionErrors((prev) => ({ ...prev, [requestId]: msg }));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const list = useMemo(() => {
    const base = tab === "incoming" ? incoming : my;

    if (!urlListingId) return base;
    if (tab !== "incoming") return base;
    return (Array.isArray(base) ? base : []).filter(
      (r) => String(r?.listingId) === String(urlListingId)
    );
  }, [tab, incoming, my, urlListingId]);

  let content = null;

  if (effectiveAuthLoading) {
    content = <div className={styles.state}>Перевіряємо сесію…</div>;
  } else if (!isAuthed) {
    content = (
      <div className={styles.state}>
        <div className={styles.stateTitle}>Потрібна авторизація</div>
        <div className={styles.stateText}>Увійди, щоб переглядати заявки.</div>

        <div className={styles.stateActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onRequireAuth?.()}
          >
            Увійти
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/")}
          >
            На головну
          </button>
        </div>
      </div>
    );
  } else if (loading) {
    content = <div className={styles.state}>Завантаження…</div>;
  } else if (error) {
    const isSessionExpired = /сесія.*закінчилась/i.test(error);

    content = (
      <div className={`${styles.state} ${styles.stateError}`}>
        <div className={styles.stateTitle}>Помилка</div>
        <div className={styles.stateText}>{error}</div>

        <div className={styles.stateActions}>
          <button type="button" className={styles.primaryBtn} onClick={refresh}>
            Спробувати ще раз
          </button>

          {isSessionExpired ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onRequireAuth?.()}
            >
              Увійти
            </button>
          ) : null}
        </div>
      </div>
    );
  } else if (!list.length) {
    const emptyText = urlListingId
      ? "Для цього оголошення поки що немає вхідних заявок."
      : tab === "incoming"
        ? "У тебе ще немає вхідних заявок."
        : "Ти ще не надсилав заявки на перегляд.";

    content = (
      <div className={styles.state}>
        <div className={styles.stateTitle}>Поки що порожньо</div>
        <div className={styles.stateText}>{emptyText}</div>
      </div>
    );
  } else {
    const canUseActions = tab === "incoming";

    content = (
      <div className={styles.list}>
        {list.map((r) => {
          const listingTitle = r?.listing?.title || "Оголошення";
          const from = formatUaDateFromIso(r?.from);
          const to = formatUaDateFromIso(r?.to);

          const tenantName = getPersonName(r?.tenant);
          const tenantRating =
            typeof r?.tenant?.rating === "number"
              ? ` (${r.tenant.rating})`
              : "";

          const landlordLabel =
            r?.listing?.landlordName || r?.listing?.ownerId || "—";

          const isUpdating = updatingIds.has(r.id);

          const isPending = r.status === "PENDING";
          const isApproved = r.status === "APPROVED";
          const isRejected = r.status === "REJECTED";
          const isCompleted = r.status === "COMPLETED";

          const actionError = actionErrors[r.id];

          return (
            <article key={r.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitleWrap}>
                  <div className={styles.cardTitle}>{listingTitle}</div>

                  <div className={styles.subRow}>
                    <span className={`${styles.badge} ${statusTone(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                    <span className={styles.dot}>•</span>
                    <span className={styles.dates}>
                      {from} — {to}
                    </span>
                  </div>
                </div>

                <div className={styles.topRight}>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => navigate(`/listings/${r.listingId}`)}
                  >
                    Відкрити оголошення
                  </button>

                  {canUseActions ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => onChangeStatus(r.id, "APPROVED")}
                        disabled={isUpdating || !isPending}
                        title={!isPending ? "Доступно тільки для PENDING" : ""}
                      >
                        Схвалити
                      </button>

                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => onChangeStatus(r.id, "REJECTED")}
                        disabled={isUpdating || !isPending}
                        title={!isPending ? "Доступно тільки для PENDING" : ""}
                      >
                        Відхилити
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => onChangeStatus(r.id, "COMPLETED")}
                        disabled={
                          isUpdating || isRejected || isCompleted || !isApproved
                        }
                        title={
                          !isApproved
                            ? "Завершити можна тільки після схвалення"
                            : ""
                        }
                      >
                        Завершити
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {actionError ? (
                <div className={styles.inlineError}>{actionError}</div>
              ) : null}

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>
                    {tab === "incoming" ? "Орендар" : "Орендодавець"}
                  </div>
                  <div className={styles.metaValue}>
                    {tab === "incoming"
                      ? `${tenantName}${tenantRating}`
                      : landlordLabel}
                  </div>
                </div>

                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>ID заявки</div>
                  <div className={styles.metaValue}>{r.id}</div>
                </div>
              </div>

              <div className={styles.messageLabel}>Повідомлення</div>
              <div className={styles.messageBox}>
                {r?.message ? r.message : "—"}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  const isListingFiltered = Boolean(urlListingId);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>Заявки</h1>

          <div className={styles.headActions}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === "my" ? styles.tabActive : ""}`}
                onClick={() => {
                  if (isListingFiltered) return;

                  setTab("my");
                  const next = new URLSearchParams(searchParams);
                  next.set("tab", "my");
                  next.delete("listingId");
                  setSearchParams(next, { replace: true });
                }}
                disabled={tabsDisabled || isListingFiltered}
                title={
                  isListingFiltered
                    ? "Фільтр по оголошенню працює тільки для 'Вхідні'"
                    : ""
                }
              >
                Мої ({myCount})
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${tab === "incoming" ? styles.tabActive : ""}`}
                onClick={() => {
                  setTab("incoming");
                  const next = new URLSearchParams(searchParams);
                  next.set("tab", "incoming");
                  setSearchParams(next, { replace: true });
                }}
                disabled={tabsDisabled}
              >
                Вхідні ({incomingCount})
              </button>
            </div>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={refresh}
              disabled={tabsDisabled || loading}
              title="Оновити список"
            >
              Оновити
            </button>
          </div>
        </div>

        <div className={styles.shell}>{content}</div>
      </div>
    </div>
  );
}
