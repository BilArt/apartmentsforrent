import { useEffect, useMemo, useState } from "react";
import styles from "./RequestsPage.module.scss";
import { requestsApi } from "../../api/requests";

const TABS = {
  MY: "my",
  INCOMING: "incoming",
};

const STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
};

function formatDateUA(s) {
  if (!s) return "—";
  // ожидаем YYYY-MM-DD или ISO, на всякий:
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return String(s);
}

function statusLabel(st) {
  switch (st) {
    case STATUS.PENDING:
      return "Очікує";
    case STATUS.APPROVED:
      return "Схвалено";
    case STATUS.REJECTED:
      return "Відхилено";
    case STATUS.COMPLETED:
      return "Завершено";
    default:
      return st || "—";
  }
}

export default function RequestsPage({ currentUser, onRequireAuth }) {
  const [tab, setTab] = useState(TABS.MY);

  const [my, setMy] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");

  const isAuthed = Boolean(currentUser);

  useEffect(() => {
    if (!isAuthed) {
      onRequireAuth?.();
      return;
    }

    let alive = true;

    (async () => {
      try {
        setStatus("loading");
        setError("");

        // параллельно
        const [myRes, incomingRes] = await Promise.all([
          requestsApi.getMy().catch((e) => {
            throw e;
          }),
          requestsApi.getIncoming().catch((e) => {
            throw e;
          }),
        ]);

        if (!alive) return;

        const myList = Array.isArray(myRes) ? myRes : [];
        const incList = Array.isArray(incomingRes) ? incomingRes : [];

        setMy(myList);
        setIncoming(incList);

        // авто-таб: если входящие есть — показываем их
        setTab(incList.length > 0 ? TABS.INCOMING : TABS.MY);

        setStatus("ok");
      } catch (e) {
        if (!alive) return;

        const msg = e?.message || "Failed to load requests";
        setError(msg);
        setStatus("error");

        // если сервер вернул 401 (обычно сообщение "Not authenticated")
        if (String(msg).toLowerCase().includes("not authenticated")) {
          onRequireAuth?.();
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthed]);

  const activeList = tab === TABS.INCOMING ? incoming : my;

  const updateStatus = async (requestId, nextStatus) => {
    try {
      // оптимистично обновим UI в incoming
      setIncoming((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: nextStatus } : r))
      );

      const updated = await requestsApi.updateStatus(requestId, nextStatus);

      // и точно синхронизируем
      setIncoming((prev) =>
        prev.map((r) => (r.id === requestId ? updated : r))
      );
    } catch (e) {
      // откатимся (перезагрузим входящие)
      try {
        const inc = await requestsApi.getIncoming();
        setIncoming(Array.isArray(inc) ? inc : []);
      } catch {
        // игнор
      }
      alert(e?.message || "Failed to update status");
    }
  };

  const tabsMeta = useMemo(
    () => [
      { id: TABS.MY, label: `Мої заявки (${my.length})` },
      { id: TABS.INCOMING, label: `Вхідні (${incoming.length})` },
    ],
    [my.length, incoming.length]
  );

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Заявки</h1>

          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Requests tabs"
          >
            {tabsMeta.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => setTab(t.id)}
                  aria-selected={active}
                  role="tab"
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {status === "loading" && (
          <div className={styles.state}>Завантаження…</div>
        )}

        {status === "error" && (
          <div className={`${styles.state} ${styles.stateError}`}>
            Помилка: {error}
          </div>
        )}

        {status === "ok" && (
          <>
            {activeList.length === 0 ? (
              <div className={styles.empty}>
                {tab === TABS.INCOMING
                  ? "Вхідних заявок поки немає."
                  : "Ти ще не створював(ла) заявок."}
              </div>
            ) : (
              <div className={styles.list}>
                {activeList.map((r) => {
                  const listingTitle =
                    r?.listing?.title || r?.listingId || "Оголошення";
                  const tenantName = r?.tenant
                    ? `${r.tenant.firstName} ${r.tenant.lastName}`
                    : r?.tenantId;

                  return (
                    <article key={r.id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div>
                          <div className={styles.cardTitle}>{listingTitle}</div>
                          <div className={styles.cardSub}>
                            <span className={styles.pill}>
                              {statusLabel(r.status)}
                            </span>
                            <span className={styles.dot}>•</span>
                            <span>
                              {formatDateUA(r.from)} — {formatDateUA(r.to)}
                            </span>
                          </div>
                        </div>

                        {tab === TABS.INCOMING ? (
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              disabled={r.status !== STATUS.PENDING}
                              onClick={() =>
                                updateStatus(r.id, STATUS.APPROVED)
                              }
                            >
                              Схвалити
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtnGhost}
                              disabled={r.status !== STATUS.PENDING}
                              onClick={() =>
                                updateStatus(r.id, STATUS.REJECTED)
                              }
                            >
                              Відхилити
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtnGhost}
                              disabled={r.status !== STATUS.APPROVED}
                              onClick={() =>
                                updateStatus(r.id, STATUS.COMPLETED)
                              }
                            >
                              Завершити
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {tab === TABS.INCOMING ? (
                        <div className={styles.row}>
                          <div className={styles.label}>Орендар</div>
                          <div className={styles.value}>
                            {tenantName}
                            {typeof r?.tenant?.rating === "number"
                              ? ` (⭐ ${r.tenant.rating})`
                              : ""}
                          </div>
                        </div>
                      ) : null}

                      {r.message ? (
                        <div className={styles.messageBox}>
                          <div className={styles.label}>Повідомлення</div>
                          <pre className={styles.message}>{r.message}</pre>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
