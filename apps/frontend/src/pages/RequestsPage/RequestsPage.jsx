import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestsApi } from "../../api/requests";
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

  const tabFromUrl = searchParams.get("tab");
  const listingIdFromUrl = searchParams.get("listingId");

  const [tab, setTab] = useState(tabFromUrl === "my" ? "my" : "incoming");

  // sync local tab with URL
  useEffect(() => {
    const t = tabFromUrl === "my" ? "my" : "incoming";
    setTab(t);
  }, [tabFromUrl]);

  const isAuthed = !authLoading && Boolean(currentUser);
  const tabsDisabled = authLoading || !isAuthed;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [my, setMy] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [actionErrors, setActionErrors] = useState({});

  const incomingCount = incoming?.length || 0;
  const myCount = my?.length || 0;

  const refresh = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) return;
    refresh();
  }, [authLoading, isAuthed, refresh]);

  const onChangeStatus = useCallback(async (requestId, newStatus) => {
    if (!requestId) return;

    const rid = String(requestId);

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(rid);
      return next;
    });

    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[rid];
      return next;
    });

    try {
      const updated = await requestsApi.updateStatus(rid, newStatus);

      window.dispatchEvent(
        new CustomEvent("requestStatusChanged", {
          detail: {
            listingId: String(updated?.listingId),
            status: updated?.status,
            requestId: String(updated?.id || rid),
          },
        }),
      );

      const applyUpdated = (arr) =>
        arr.map((r) => (String(r?.id) === rid ? updated : r));

      setIncoming((prev) => applyUpdated(prev));
      setMy((prev) => applyUpdated(prev));
    } catch (e) {
      const msg = e?.message || "Не вдалося оновити статус";
      setActionErrors((prev) => ({ ...prev, [rid]: msg }));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(rid);
        return next;
      });
    }
  }, []);

  const rawList = tab === "incoming" ? incoming : my;

  const list = useMemo(() => {
    if (!listingIdFromUrl) return rawList;
    return rawList.filter(
      (r) => String(r?.listingId) === String(listingIdFromUrl),
    );
  }, [rawList, listingIdFromUrl]);

  const clearListingFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("listingId");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const setTabTo = useCallback(
    (nextTab) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", nextTab);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  let content = null;

  if (authLoading) {
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
    content = (
      <div className={styles.state}>
        <div className={styles.stateTitle}>Поки що порожньо</div>
        <div className={styles.stateText}>
          {listingIdFromUrl
            ? "Немає заявок для цього оголошення."
            : tab === "incoming"
              ? "У тебе ще немає вхідних заявок."
              : "Ти ще не надсилав заявки на перегляд."}
        </div>

        {listingIdFromUrl ? (
          <div className={styles.stateActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={clearListingFilter}
            >
              Скинути фільтр
            </button>
          </div>
        ) : null}
      </div>
    );
  } else {
    const canUseActions = tab === "incoming";

    content = (
      <div className={styles.list}>
        {list.map((r) => {
          const rid = String(r?.id);
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
          const isUpdating = updatingIds.has(rid);

          const isPending = r.status === "PENDING";
          const isApproved = r.status === "APPROVED";
          const isRejected = r.status === "REJECTED";
          const isCompleted = r.status === "COMPLETED";

          const actionError = actionErrors[rid];

          return (
            <article key={rid} className={styles.card}>
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
                    Відкрити
                  </button>

                  {canUseActions ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => onChangeStatus(rid, "APPROVED")}
                        disabled={isUpdating || !isPending}
                        title={!isPending ? "Доступно тільки для PENDING" : ""}
                      >
                        Схвалити
                      </button>

                      <button
                        type="button"
                        className={`${styles.ghostBtn} ${styles.dangerBtn}`}
                        onClick={() => onChangeStatus(rid, "REJECTED")}
                        disabled={isUpdating || !isPending}
                        title={!isPending ? "Доступно тільки для PENDING" : ""}
                      >
                        Відхилити
                      </button>

                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => onChangeStatus(rid, "COMPLETED")}
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
                  <div className={styles.metaValue}>{rid}</div>
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
                onClick={() => setTabTo("my")}
                disabled={tabsDisabled}
              >
                Мої ({myCount})
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${tab === "incoming" ? styles.tabActive : ""}`}
                onClick={() => setTabTo("incoming")}
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

        {listingIdFromUrl ? (
          <div className={styles.filterRow}>
            <span className={styles.filterChip}>
              Фільтр: {listingIdFromUrl}
            </span>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={clearListingFilter}
            >
              Скинути
            </button>
          </div>
        ) : null}

        <div className={styles.shell}>{content}</div>
      </div>
    </div>
  );
}
