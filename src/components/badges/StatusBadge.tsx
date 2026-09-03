import type { BookingStatus } from '../../schemas/booking.schema'
import styles from './StatusBadge.module.css'

const LABELS: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

interface StatusBadgeProps {
  status: BookingStatus
}

/** Badge de estado de reserva — colores fijados en Context.md 5.5. */
export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>
)
