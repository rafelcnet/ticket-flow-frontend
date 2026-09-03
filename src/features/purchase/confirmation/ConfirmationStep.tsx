import { useNavigate } from 'react-router-dom'
import type { Booking } from '../../../schemas/booking.schema'
import { ROUTES } from '../../../routes/routes.config'
import styles from './ConfirmationStep.module.css'

interface ConfirmationStepProps {
  booking: Booking
  onBuyAnother: () => void
}

/**
 * Paso 5 — Confirmation (Context.md 5.4). Presentación pura: todos los datos
 * vienen ya resueltos en `booking`, la respuesta de `POST /bookings`
 * ("no se necesita un fetch adicional") — no lee la slice `purchase`
 * directamente ni conoce cómo se llegó hasta aquí.
 */
export const ConfirmationStep = ({ booking, onBuyAnother }: ConfirmationStepProps) => {
  const navigate = useNavigate()

  return (
    <div className={styles.confirmation}>
      <span className={styles.icon} aria-hidden="true">
        ✅
      </span>
      <h2 className={styles.heading}>¡Reservación confirmada!</h2>
      <p className={styles.bookingId}>{booking.id}</p>
      <p className={styles.emailNote}>Tus tickets se enviarán a {booking.contactEmail}</p>

      <div className={styles.summary}>
        <p className={styles.summaryTitle}>{booking.eventName}</p>
        <p className={styles.summaryLine}>
          {booking.eventDate} · {booking.eventTime}
        </p>
        <p className={styles.summaryLine}>
          Fila {booking.row}, Columna {booking.col} — {booking.zone}
        </p>
        <p className={styles.total}>
          Total: ${booking.total.toFixed(2)} {booking.currency}
        </p>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => navigate(ROUTES.bookings)}
        >
          View my tickets
        </button>
        <button type="button" className={styles.primary} onClick={onBuyAnother}>
          Buy another
        </button>
      </div>
    </div>
  )
}
