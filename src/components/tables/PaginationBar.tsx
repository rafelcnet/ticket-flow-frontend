import styles from './PaginationBar.module.css'

interface PaginationBarProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Barra de paginación genérica — Previous, números de página, Next.
 * Reutilizada por `/bookings` (Context.md 5.5) y por el Paso 1 de `/buy`
 * (FIX-1) — sin conocimiento de bookings ni de eventos: sólo `page`/
 * `totalPages`/`onPageChange`, siempre resueltos por quien la usa a partir
 * de lo que devuelve el servidor (nunca recalculados aquí).
 * Los botones Previous/Next llevan `aria-label` con "page" (nombre accesible
 * distinto del texto visible) porque en `/buy` conviven con el botón Next
 * del stepper — sin esto, ambos serían indistinguibles por lectores de
 * pantalla y por selectores de test basados en el rol accesible.
 */
export const PaginationBar = ({ page, totalPages, onPageChange }: PaginationBarProps) => {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <button
        type="button"
        aria-label="Previous page"
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
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  )
}
