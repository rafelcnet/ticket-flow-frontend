import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingsFilterBar } from './BookingsFilterBar'

describe('BookingsFilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prellena los controles con los filtros ya activos en la URL (SpecBookings 1)', () => {
    // Given / When: se renderiza con filtros ya aplicados
    render(
      <BookingsFilterBar
        filters={{
          eventName: 'Bad Liebre',
          status: 'confirmed',
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
        }}
        onChange={vi.fn()}
      />,
    )

    // Then: cada control refleja el filtro correspondiente
    expect(screen.getByLabelText('Buscar por evento')).toHaveValue('Bad Liebre')
    expect(screen.getByLabelText('Status')).toHaveValue('confirmed')
    expect(screen.getByLabelText('Date from')).toHaveValue('2025-01-01')
    expect(screen.getByLabelText('Date to')).toHaveValue('2025-12-31')
  })

  it('no dispara onChange por escribir en el buscador antes de que pase el debounce (SpecBookings 2)', () => {
    // Given: el buscador vacío
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{}} onChange={onChange} />)

    // When: el usuario escribe, sin esperar la pausa
    fireEvent.change(screen.getByLabelText('Buscar por evento'), { target: { value: 'Bad' } })

    // Then: todavía no se llamó a onChange
    expect(onChange).not.toHaveBeenCalled()
  })

  it('dispara onChange con el texto final tras la pausa de escritura (debounce, SpecBookings 2)', async () => {
    // Given: el buscador vacío
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{}} onChange={onChange} />)

    // When: el usuario escribe y deja pasar la pausa del debounce
    fireEvent.change(screen.getByLabelText('Buscar por evento'), {
      target: { value: 'Bad Liebre' },
    })
    await vi.advanceTimersByTimeAsync(400)

    // Then: se refleja en la URL con el texto completo, una sola vez
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ eventName: 'Bad Liebre' })
  })

  it('reinicia la pausa si el usuario sigue escribiendo antes de que se cumpla (debounce real)', async () => {
    // Given: el buscador vacío
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{}} onChange={onChange} />)
    const input = screen.getByLabelText('Buscar por evento')

    // When: escribe, espera menos que el debounce, y sigue escribiendo
    fireEvent.change(input, { target: { value: 'Bad' } })
    await vi.advanceTimersByTimeAsync(300)
    fireEvent.change(input, { target: { value: 'Bad Liebre' } })
    await vi.advanceTimersByTimeAsync(300)

    // Then: todavía no se cumplió una pausa completa desde el último cambio
    expect(onChange).not.toHaveBeenCalled()

    // When: ahora sí pasa la pausa completa
    await vi.advanceTimersByTimeAsync(100)

    // Then: se notifica una sola vez, con el texto final
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ eventName: 'Bad Liebre' })
  })

  it('envía undefined al vaciar el buscador (limpia el filtro eventName de la URL)', async () => {
    // Given: un filtro de evento ya aplicado
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{ eventName: 'Bad Liebre' }} onChange={onChange} />)

    // When: el usuario borra el texto
    fireEvent.change(screen.getByLabelText('Buscar por evento'), { target: { value: '' } })
    await vi.advanceTimersByTimeAsync(400)

    // Then: se pide limpiar el filtro
    expect(onChange).toHaveBeenCalledWith({ eventName: undefined })
  })

  it('no vuelve a llamar a onChange si la URL ya trae el mismo eventName (evita un ciclo con el "atrás" del navegador)', async () => {
    // Given: los filtros cambian por fuera (ej. botón "atrás"), no por escritura del usuario
    const onChange = vi.fn()
    const { rerender } = render(<BookingsFilterBar filters={{}} onChange={onChange} />)
    rerender(<BookingsFilterBar filters={{ eventName: 'Bad Liebre' }} onChange={onChange} />)

    // When: pasa el tiempo del debounce
    await vi.advanceTimersByTimeAsync(400)

    // Then: no se dispara una escritura redundante a la misma URL
    expect(onChange).not.toHaveBeenCalled()
  })

  it('actualiza el status de inmediato, sin debounce (SpecBookings 2: selección discreta)', () => {
    // Given: el filtro de status sin aplicar
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{}} onChange={onChange} />)

    // When: el usuario elige un status, sin esperar ningún tiempo
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pending' } })

    // Then: se notifica de inmediato
    expect(onChange).toHaveBeenCalledWith({ status: 'pending' })
  })

  it('envía undefined al volver a "Todos los estados"', () => {
    // Given: un filtro de status ya aplicado
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{ status: 'pending' }} onChange={onChange} />)

    // When: el usuario vuelve a la opción "Todos los estados"
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '' } })

    // Then: se pide limpiar el filtro
    expect(onChange).toHaveBeenCalledWith({ status: undefined })
  })

  it('actualiza dateFrom y dateTo de inmediato, sin debounce', () => {
    // Given: los filtros de fecha sin aplicar
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{}} onChange={onChange} />)

    // When: el usuario elige la fecha "desde"
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2025-01-01' } })

    // Then: se notifica de inmediato, sin esperar ningún timer
    expect(onChange).toHaveBeenCalledWith({ dateFrom: '2025-01-01' })

    // When: el usuario elige la fecha "hasta"
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2025-12-31' } })

    // Then: también se notifica de inmediato
    expect(onChange).toHaveBeenCalledWith({ dateTo: '2025-12-31' })
  })

  it('envía undefined al limpiar dateFrom', () => {
    // Given: un filtro de fecha "desde" ya aplicado
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{ dateFrom: '2025-01-01' }} onChange={onChange} />)

    // When: el usuario limpia el selector de fecha
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '' } })

    // Then: se pide limpiar el filtro
    expect(onChange).toHaveBeenCalledWith({ dateFrom: undefined })
  })

  it('envía undefined al limpiar dateTo', () => {
    // Given: un filtro de fecha "hasta" ya aplicado
    const onChange = vi.fn()
    render(<BookingsFilterBar filters={{ dateTo: '2025-12-31' }} onChange={onChange} />)

    // When: el usuario limpia el selector de fecha
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '' } })

    // Then: se pide limpiar el filtro
    expect(onChange).toHaveBeenCalledWith({ dateTo: undefined })
  })
})
