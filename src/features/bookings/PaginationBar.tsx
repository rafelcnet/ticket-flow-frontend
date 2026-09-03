import styles from './PaginationBar.module.css'

interface PaginationBarProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Barra de paginación — Previous, números de página, Next (Context.md 5.5).
 * `page`/`totalPages` vienen de la slice `bookings`, nunca se recalculan
 * aquí (SpecBookings 3: la paginación siempre viene del servidor).
 */
export const PaginationBar = ({ page, totalPages, onPageChange }: PaginationBarProps) => {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className={styles.pagination} aria-label="Paginación de reservas">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={pageNumber === page ? styles.currentPage : undefined}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  )
}
