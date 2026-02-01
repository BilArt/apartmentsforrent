import styles from "./ConfirmModal.module.scss";

export default function ConfirmModal({
  title = "Підтвердження",
  message,
  confirmText = "Підтвердити",
  cancelText = "Скасувати",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>

      {message ? <div className={styles.message}>{message}</div> : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </button>

        <button
          type="button"
          className={tone === "danger" ? styles.dangerBtn : styles.confirmBtn}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Обробляю..." : confirmText}
        </button>
      </div>

      <div className={styles.note}>
        {tone === "danger" ? "Цю дію не можна скасувати." : null}
      </div>
    </div>
  );
}
