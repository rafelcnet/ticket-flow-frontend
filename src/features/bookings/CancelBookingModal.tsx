import styles from './CancelBookingModal.module.css'

interface CancelBookingModalProps {
  onConfirm: () => void
  onDismiss: () => void
}

/**
 * Modal de confirmación de cancelación — texto literal de Context.md 5.5
 * (SpecBookings 4.3: `CANCEL_CLICK` → modal, `CANCEL_CONFIRM` /
 * `CANCEL_DISMISS`).
 */
export const CancelBookingModal = ({ onConfirm, onDismiss }: CancelBookingModalProps) => (
  <div className={styles.backdrop} onClick={onDismiss}>
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-booking-title"
      onClick={(event) => event.stopPropagation()}
    >
      <p id="cancel-booking-title">¿Seguro que quieres cancelar esta reservación?</p>
      <div className={styles.actions}>
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          No, mantener
        </button>
        <button type="button" className={styles.confirm} onClick={onConfirm}>
          Sí, cancelar
        </button>
      </div>
    </div>
  </div>
)
