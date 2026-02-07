import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MyListingsPage.module.scss";
import { listingsApi } from "../../api/listings";

import Modal from "../../components/Modal/Modal";
import ListingForm from "../../components/ListingForm/ListingForm";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

function listingStatus(l) {
  return l?.status === "HIDDEN" ? "HIDDEN" : "ACTIVE";
}

export default function MyListingsPage({
  currentUser,
  authLoading,
  onRequireAuth,
}) {
  const navigate = useNavigate();

  const isAuthed = !authLoading && Boolean(currentUser);

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [editItem, setEditItem] = useState(null);

  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [inlineErrors, setInlineErrors] = useState({});

  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  const [tab, setTab] = useState("active");

  const [confirm, setConfirm] = useState({
    open: false,
    listingId: null,
    title: "Видалити оголошення?",
    message: "",
  });

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const data = await listingsApi.getMy();
      setItems(Array.isArray(data) ? data : []);
      setStatus("ok");
    } catch (e) {
      const msg = e?.message || "Не вдалося завантажити оголошення";
      if (/not authenticated|unauthorized|401/i.test(String(msg))) {
        setError("Схоже, твоя сесія закінчилась. Увійди ще раз.");
      } else {
        setError(msg);
      }
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) return;

    let alive = true;

    (async () => {
      setStatus("loading");
      setError("");

      try {
        const data = await listingsApi.getMy();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        const msg = e?.message || "Не вдалося завантажити оголошення";
        if (/not authenticated|unauthorized|401/i.test(String(msg))) {
          setError("Схоже, твоя сесія закінчилась. Увійди ще раз.");
        } else {
          setError(msg);
        }
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [authLoading, isAuthed]);

  const onEdit = (item) => setEditItem(item);
  const closeEdit = () => setEditItem(null);

  const onEdited = (updated) => {
    setItems((prev) =>
      prev.map((x) => (String(x.id) === String(updated.id) ? updated : x))
    );
    closeEdit();
  };

  const openDeleteConfirm = (listing) => {
    const title = listing?.title || "Оголошення";
    setConfirm({
      open: true,
      listingId: listing?.id,
      title: "Видалити оголошення?",
      message: `Ти справді хочеш видалити “${title}”?`,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirm((prev) => ({ ...prev, open: false, listingId: null }));
  };

  const confirmDelete = async () => {
    const id = confirm.listingId;
    if (!id) return;

    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await listingsApi.remove(id);
      setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
      closeDeleteConfirm();
    } catch (e) {
      const msg = e?.message || "Не вдалося видалити оголошення";
      setInlineErrors((prev) => ({ ...prev, [id]: msg }));
      closeDeleteConfirm();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleVisibility = async (listing) => {
    const id = listing?.id;
    if (!id) return;

    const nextStatus =
      listingStatus(listing) === "ACTIVE" ? "HIDDEN" : "ACTIVE";

    setInlineErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const updated = await listingsApi.update(id, { status: nextStatus });
      setItems((prev) =>
        prev.map((x) => (String(x.id) === String(updated.id) ? updated : x))
      );
    } catch (e) {
      const msg = e?.message || "Не вдалося змінити статус оголошення";
      setInlineErrors((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const counts = useMemo(() => {
    const active = items.filter((x) => listingStatus(x) === "ACTIVE").length;
    const archived = items.filter((x) => listingStatus(x) === "HIDDEN").length;
    return { active, archived };
  }, [items]);

  const filteredItems = useMemo(() => {
    const want = tab === "archived" ? "HIDDEN" : "ACTIVE";
    return items.filter((x) => listingStatus(x) === want);
  }, [items, tab]);

  const isConfirmDeleting = confirm.listingId
    ? deletingIds.has(confirm.listingId)
    : false;

  const pageContent = useMemo(() => {
    if (authLoading) {
      return (
        <div className={styles.shell}>
          <div className={styles.state}>Перевіряємо сесію…</div>
        </div>
      );
    }

    if (!isAuthed) {
      return (
        <div className={styles.shell}>
          <div className={styles.state}>
            <div className={styles.stateTitle}>Потрібна авторизація</div>
            <div className={styles.stateText}>
              Увійди, щоб переглядати свої оголошення.
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
        </div>
      );
    }

    return (
      <div className={styles.shell}>
        <div className={styles.tabsRow}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "active" ? styles.tabActive : ""}`}
              onClick={() => setTab("active")}
              disabled={status === "loading"}
            >
              Активні ({counts.active})
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "archived" ? styles.tabActive : ""}`}
              onClick={() => setTab("archived")}
              disabled={status === "loading"}
            >
              Архів ({counts.archived})
            </button>
          </div>
        </div>

        {status === "loading" && (
          <div className={styles.state}>Завантаження…</div>
        )}

        {status === "error" && (
          <div className={`${styles.state} ${styles.stateError}`}>
            <div className={styles.stateTitle}>Помилка</div>
            <div className={styles.stateText}>{error}</div>

            <div className={styles.stateActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={load}
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
        )}

        {status === "ok" && items.length === 0 && (
          <div className={styles.state}>
            <div className={styles.stateTitle}>Поки що порожньо</div>
            <div className={styles.stateText}>
              Ти ще не створював оголошення. Натисни “Додати об’єкт”.
            </div>
          </div>
        )}

        {status === "ok" && items.length > 0 && filteredItems.length === 0 && (
          <div className={styles.state}>
            <div className={styles.stateTitle}>Поки що порожньо</div>
            <div className={styles.stateText}>
              {tab === "archived"
                ? "В архіві немає оголошень."
                : "Активних оголошень немає."}
            </div>
          </div>
        )}

        {status === "ok" && filteredItems.length > 0 && (
          <div className={styles.list}>
            {filteredItems.map((l) => {
              const isDeleting = deletingIds.has(l.id);
              const isUpdating = updatingIds.has(l.id);
              const inlineError = inlineErrors[l.id];

              const st = listingStatus(l);
              const badge =
                st === "HIDDEN" ? (
                  <span className={`${styles.badge} ${styles.badgeHidden}`}>
                    Архів
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeActive}`}>
                    Активне
                  </span>
                );

              return (
                <article key={l.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardLeft}>
                      <div className={styles.titleRow}>
                        <div className={styles.title}>
                          {l?.title || "Оголошення"}
                        </div>
                        {badge}
                      </div>

                      <div className={styles.sub}>
                        {(l?.city?.nameUk || l?.city?.name || "—").toString()}
                        {l?.address ? ` • ${l.address}` : ""}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.primarySolidBtn}
                      onClick={() => navigate(`/listings/${l.id}`)}
                      disabled={!l?.id}
                    >
                      Відкрити
                    </button>
                  </div>

                  {inlineError ? (
                    <div className={styles.inlineError}>{inlineError}</div>
                  ) : null}

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primarySolidBtn}
                      onClick={() =>
                        navigate(
                          `/requests?tab=incoming&listingId=${encodeURIComponent(
                            String(l.id)
                          )}`
                        )
                      }
                      disabled={!l?.id}
                      title="Показати вхідні заявки для цього оголошення"
                    >
                      Вхідні заявки
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => onEdit(l)}
                      disabled={!l?.id || isDeleting || isUpdating}
                      title="Редагувати оголошення"
                    >
                      Редагувати
                    </button>

                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => toggleVisibility(l)}
                      disabled={!l?.id || isDeleting || isUpdating}
                      title={
                        st === "HIDDEN"
                          ? "Повернути в активні"
                          : "Сховати з каталогу"
                      }
                    >
                      {isUpdating
                        ? "Змінюю..."
                        : st === "HIDDEN"
                          ? "Відновити"
                          : "Сховати"}
                    </button>

                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => openDeleteConfirm(l)}
                      disabled={!l?.id || isDeleting || isUpdating}
                      title="Видалити оголошення"
                    >
                      {isDeleting ? "Видаляю..." : "Видалити"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [
    authLoading,
    isAuthed,
    status,
    items,
    filteredItems,
    tab,
    counts,
    error,
    load,
    navigate,
    onRequireAuth,
    deletingIds,
    updatingIds,
    inlineErrors,
  ]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.headRow}>
          <h1 className={styles.h1}>Мої оголошення</h1>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={load}
            disabled={status === "loading" || authLoading}
            title="Оновити список"
          >
            Оновити
          </button>
        </div>

        {pageContent}

        {editItem && (
          <Modal title="Редагувати оголошення" onClose={closeEdit}>
            <ListingForm
              mode="edit"
              initialValue={editItem}
              onSubmitted={onEdited}
            />
          </Modal>
        )}

        {confirm.open && (
          <Modal title="" onClose={closeDeleteConfirm}>
            <ConfirmModal
              title={confirm.title}
              message={confirm.message}
              confirmText="Так, видалити"
              cancelText="Скасувати"
              tone="danger"
              isLoading={isConfirmDeleting}
              onCancel={closeDeleteConfirm}
              onConfirm={confirmDelete}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
