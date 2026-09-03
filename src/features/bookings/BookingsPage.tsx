import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBookings } from '../../hooks/useBookings'
import { BookingsProvider } from '../../state/bookings/bookings.context'
import { cancelBooking, listBookings } from '../../services/bookings.service'
import { ApiError } from '../../http/http.types'
import { ROUTES } from '../../routes/routes.config'
import type { BookingsFilters } from '../../state/bookings/bookings.reducer'
import {
  parseFiltersFromSearchParams,
  parseLimitFromSearchParams,
  parsePageFromSearchParams,
} from './bookings-query.utils'
import { BookingsFilterBar } from './BookingsFilterBar'
import { BookingsTable } from './BookingsTable'
import { PaginationBar } from './PaginationBar'
import { CancelBookingModal } from './CancelBookingModal'
import styles from './BookingsPage.module.css'

/**
 * Pantalla 4 — My Bookings (`/bookings`, Context.md 5.5, SpecBookings).
 * `filters`/`page`/`limit` se leen siempre de la URL (SpecBookings 1) — la
 * slice `bookings` es un espejo, nunca la fuente.
 */
const BookingsPageContent = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { state, dispatch } = useBookings()
  const navigate = useNavigate()
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const filters = parseFiltersFromSearchParams(searchParams)
  const page = parsePageFromSearchParams(searchParams)
  const limit = parseLimitFromSearchParams(searchParams)
  const searchParamsKey = searchParams.toString()

  useEffect(() => {
    dispatch({ type: 'LOAD_BOOKINGS', payload: { filters, page, limit } })
    // La URL (searchParamsKey) es la única fuente de filters/page/limit —
    // se relee de ahí en cada cambio, no de los objetos recreados por render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey, dispatch])

  useEffect(() => {
    if (state.status !== 'loading') {
      return
    }
    let cancelled = false

    listBookings({ ...state.filters, page: state.page, limit: state.limit })
      .then((response) => {
        if (cancelled) return
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            items: response.data,
            pagination: {
              total: response.pagination.total,
              totalPages: response.pagination.totalPages,
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'LOAD_ERROR' })
      })

    return () => {
      cancelled = true
    }
  }, [state.status, state.filters, state.page, state.limit, dispatch])

  const updateFilters = (patch: Partial<BookingsFilters>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    })
    next.delete('page')
    setSearchParams(next)
  }

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const revalidate = () => {
    dispatch({
      type: 'LOAD_BOOKINGS',
      payload: { filters: state.filters, page: state.page, limit: state.limit },
    })
  }

  const handleCancelConfirm = async () => {
    const id = pendingCancelId
    if (!id) {
      return
    }
    setPendingCancelId(null)
    setCancellingId(id)

    try {
      const result = await cancelBooking(id)
      dispatch({ type: 'CANCEL_SUCCESS', payload: result })
    } catch (error) {
      // 409 INVALID_TRANSITION / 404 BOOKING_NOT_FOUND (SpecBookings 6.3/6.4):
      // la copia local estaba desactualizada — se revalida en vez de aplicar el patch.
      if (
        error instanceof ApiError &&
        (error.code === 'INVALID_TRANSITION' || error.code === 'BOOKING_NOT_FOUND')
      ) {
        revalidate()
      }
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section>
      <h1>My Bookings</h1>
      <BookingsFilterBar filters={filters} onChange={updateFilters} />

      {state.status === 'loading' && <p>Cargando reservas…</p>}
      {state.status === 'error' && <p>No pudimos cargar tus reservas.</p>}

      {state.status === 'loaded' && state.pagination.total === 0 && (
        <div className={styles.empty}>
          <p>Aún no tienes reservaciones</p>
          <button type="button" onClick={() => navigate(ROUTES.buy)}>
            Buy your first ticket
          </button>
        </div>
      )}

      {state.status === 'loaded' && state.pagination.total > 0 && (
        <>
          <BookingsTable
            bookings={state.items}
            cancellingId={cancellingId}
            onCancelClick={setPendingCancelId}
          />
          <PaginationBar
            page={state.page}
            totalPages={state.pagination.totalPages}
            onPageChange={updatePage}
          />
        </>
      )}

      {pendingCancelId && (
        <CancelBookingModal
          onConfirm={handleCancelConfirm}
          onDismiss={() => setPendingCancelId(null)}
        />
      )}
    </section>
  )
}

export const BookingsPage = () => (
  <BookingsProvider>
    <BookingsPageContent />
  </BookingsProvider>
)
