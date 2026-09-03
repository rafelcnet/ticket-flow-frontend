import { StatusBadge } from '../../components/badges/StatusBadge'
import { Table, type TableColumn } from '../../components/tables/Table'
import type { Booking } from '../../schemas/booking.schema'
import styles from './BookingsTable.module.css'

interface BookingsTableProps {
  bookings: Booking[]
  cancellingId: string | null
  onCancelClick: (id: string) => void
}

/** El botón Cancelar sólo se muestra si el status lo permite (Context.md 5.5, SpecBookings 4.3). */
const canCancel = (booking: Booking) =>
  booking.status === 'confirmed' || booking.status === 'pending'

/**
 * Tabla de reservas (Context.md 5.5) — arma las columnas sobre la `Table`
 * genérica (`components/tables`, SpecProject 2).
 */
export const BookingsTable = ({ bookings, cancellingId, onCancelClick }: BookingsTableProps) => {
  const columns: TableColumn<Booking>[] = [
    { key: 'id', header: '#', render: (booking) => booking.id },
    { key: 'event', header: 'Evento', render: (booking) => booking.eventName },
    {
      key: 'date',
      header: 'Fecha',
      render: (booking) => `${booking.eventDate} · ${booking.eventTime}`,
    },
    {
      key: 'seat',
      header: 'Asiento',
      render: (booking) => `Fila ${booking.row}, Columna ${booking.col} — ${booking.zone}`,
    },
    {
      key: 'total',
      header: 'Total',
      render: (booking) => `$${booking.total.toFixed(2)} ${booking.currency}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (booking) => <StatusBadge status={booking.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (booking) =>
        canCancel(booking) ? (
          <button
            type="button"
            className={styles.cancel}
            disabled={cancellingId === booking.id}
            onClick={() => onCancelClick(booking.id)}
          >
            {cancellingId === booking.id ? 'Cancelando…' : 'Cancelar'}
          </button>
        ) : null,
    },
  ]

  return <Table columns={columns} rows={bookings} getRowKey={(booking) => booking.id} />
}
