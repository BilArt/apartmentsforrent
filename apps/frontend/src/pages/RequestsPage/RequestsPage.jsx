import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function RequestsPage({
  currentUser,
  authLoading,
  onRequireAuth,
}) {
  const navigate = useNavigate();

  const isAuthed = !authLoading && Boolean(currentUser);

  const [tab, setTab] = useState("incoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [my, setMy] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  const incomingCount = incoming?.length || 0;
  const myCount = my?.length || 0;

  const list = tab === "incoming" ? incoming : my;

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

    if (!isAuthed) return;

    refresh();
  }, [authLoading, isAuthed]);

  const onChangeStatus = async (requestId, newStatus) => {
    if (!requestId) return;

    setUpdatingIds((prev) => new Set(prev).add(requestId));

    try {
      const updated = await requestsApi.updateStatus(requestId, newStatus);

      const applyUpdated = (arr) =>
        arr.map((r) => (r.id === requestId ? updated : r));

      setIncoming((prev) => applyUpdated(prev));
      setMy((prev) => applyUpdated(prev));
    } catch (e) {
      alert(e?.message || "Не вдалося оновити статус");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const canUseActions = tab === "incoming";

  const content = useMemo(() => {
    if (authLoading) {
      return <div className={styles.state}>Перевіряємо сесію…</div>;
    }

    if (!isAuthed) {
      return (
        <div className={styles.state}>
          <div className={styles.stateTitle}>Потрібна авторизація</div>
          <div className={styles.stateText}>
            Увійди, щоб переглядати заявки.
          </div>

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
    }

    if (loading) return <div className={styles.state}>Завантаження…</div>;

    if (error) {
      return (
        <div className={`${styles.state} ${styles.stateError}`}>
          <div className={styles.stateTitle}>Помилка</div>
          <div className={styles.stateText}>{error}</div>

          <div className={styles.stateActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={refresh}
            >
              Спробувати ще раз
            </button>

            {/сесія.*закінчилась/i.test(error) ? (
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
    }

    if (!list.length) {
      return (
        <div className={styles.state}>
          <div className={styles.stateTitle}>Поки що порожньо</div>
          <div className={styles.stateText}>
            {tab === "incoming"
              ? "У тебе ще немає вхідних заявок."
              : "Ти ще не надсилав заявки на перегляд."}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.list}>
        {list.map((r) => {
          const listingTitle = r?.listing?.title || "Оголошення";
          const from = formatUaDateFromIso(r?.from);
          const to = formatUaDateFromIso(r?.to);

          const tenantName =
            r?.tenant?.firstName || r?.tenant?.lastName
              ? `${r?.tenant?.firstName || ""} ${r?.tenant?.lastName || ""}`.trim()
              : "—";

          const tenantRating =
            typeof r?.tenant?.rating === "number"
              ? ` (⭐ ${r.tenant.rating})`
              : "";

          const isUpdating = updatingIds.has(r.id);

          const isPending = r.status === "PENDING";
          const isApproved = r.status === "APPROVED";
          const isRejected = r.status === "REJECTED";
          const isCompleted = r.status === "COMPLETED";

          const landlordLabel =
            r?.listing?.landlordName || r?.listing?.ownerId || "—";

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

                {canUseActions && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => onChangeStatus(r.id, "APPROVED")}
                      disabled={isUpdating || !isPending}
                      title={
                        !isPending ? "Доступно тільки для статусу PENDING" : ""
                      }
                    >
                      Схвалити
                    </button>

                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => onChangeStatus(r.id, "REJECTED")}
                      disabled={isUpdating || !isPending}
                      title={
                        !isPending ? "Доступно тільки для статусу PENDING" : ""
                      }
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
                )}
              </div>

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
  }, [
    authLoading,
    isAuthed,
    loading,
    error,
    list,
    tab,
    updatingIds,
    navigate,
    onRequireAuth,
  ]);

  const tabsDisabled = authLoading || !isAuthed;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>Заявки</h1>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "my" ? styles.tabActive : ""}`}
              onClick={() => setTab("my")}
              disabled={tabsDisabled}
            >
              Мої заявки ({myCount})
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "incoming" ? styles.tabActive : ""}`}
              onClick={() => setTab("incoming")}
              disabled={tabsDisabled}
            >
              Вхідні ({incomingCount})
            </button>
          </div>
        </div>

        <div className={styles.shell}>{content}</div>
      </div>
    </div>
  );
}
