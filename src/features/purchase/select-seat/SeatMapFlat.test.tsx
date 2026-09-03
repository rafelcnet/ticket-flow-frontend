import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SeatMapFlat } from './SeatMapFlat'

const zonas = [{ id: 'zon-001', name: 'General', color: '#4caf50', price: 75 }]

const asientos = [
  { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'available' as const },
  { seatId: 'sea-002', row: 1, col: 2, zone: 'zon-001', status: 'occupied' as const },
  { seatId: 'sea-003', row: 2, col: 1, zone: 'zon-001', status: 'available' as const },
]

describe('SeatMapFlat', () => {
  it('renderiza la grilla rectangular con un botón por asiento (Context.md 5.4: layout Flat)', () => {
    // Given / When: se renderiza el layout con 3 asientos
    render(
      <SeatMapFlat seats={asientos} zones={zonas} selectedSeatId={null} onSeatClick={vi.fn()} />,
    )

    // Then: hay un botón por cada asiento recibido
    expect(screen.getAllByRole('button')).toHaveLength(asientos.length)
  })

  it('marca como seleccionado el asiento cuyo id coincide con selectedSeatId', () => {
    // Given: sea-001 es el asiento seleccionado en la slice
    render(
      <SeatMapFlat seats={asientos} zones={zonas} selectedSeatId="sea-001" onSeatClick={vi.fn()} />,
    )

    // Then: sólo ese botón queda marcado como pressed
    expect(screen.getByRole('button', { name: 'Fila 1, columna 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'Fila 2, columna 1' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('notifica el seatId al hacer click en un asiento available', async () => {
    // Given: el layout con asientos disponibles
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatMapFlat seats={asientos} zones={zonas} selectedSeatId={null} onSeatClick={onSeatClick} />,
    )

    // When: el usuario elige el asiento de la fila 2
    await usuario.click(screen.getByRole('button', { name: 'Fila 2, columna 1' }))

    // Then: se notifica el seatId correspondiente
    expect(onSeatClick).toHaveBeenCalledWith('sea-003')
  })

  it('no permite clicar el asiento occupied', () => {
    // Given: el layout con un asiento ocupado
    render(
      <SeatMapFlat seats={asientos} zones={zonas} selectedSeatId={null} onSeatClick={vi.fn()} />,
    )

    // Then: el botón de ese asiento está deshabilitado
    expect(
      screen.getByRole('button', { name: 'Fila 1, columna 2 — ocupado' }),
    ).toBeDisabled()
  })
})
