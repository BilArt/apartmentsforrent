import styles from './Modal.module.scss';

function Modal({title, children, onClose}) {
    return (
        <div className='{styles.backdrop' onClick={onClose}>
            <div
            className={styles.modal}
            onClick={e => e.stopPropagaion()}
            >
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        x
                    </button>
                </div>

                <div className={styles.body}>{children}</div>
            </div>
        </div>
    )
}

export default Modal;