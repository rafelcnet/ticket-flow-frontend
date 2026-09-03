import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SeatMapArena } from './SeatMapArena'

const zonaVip = { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 }

const asientos = [
  { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'available' as const },
  { seatId: 'sea-002', row: 1, col: 2, zone: 'zon-001', status: 'occupied' as const },
]

describe('SeatMapArena', () => {
  it('renderiza un asiento clicable por cada seat, sobre un lienzo SVG (Context.md 5.4: "Rendered with SVG")', () => {
    // Given / When: se renderiza el layout arena
    const { container } = render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={vi.fn()} />,
    )

    // Then: es un SVG con un botón por asiento
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(asientos.length)
  })

  it('un asiento available usa el color de su zona (VIP/Premium/General) como fill', () => {
    // Given: un asiento disponible de la zona VIP
    render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={vi.fn()} />,
    )

    // Then: el círculo refleja el color de zona
    expect(screen.getByRole('button', { name: 'Fila 1, columna 1' })).toHaveStyle({
      fill: zonaVip.color,
    })
  })

  it('muestra un <title> SVG (popover) sólo sobre asientos available, no sobre occupied', () => {
    // Given: un asiento available y uno occupied
    const { container } = render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={vi.fn()} />,
    )

    // Then: sólo hay un <title> (el del asiento available)
    const titulos = container.querySelectorAll('title')
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Fila 1, Columna 1 — VIP ($150.00)')
  })

  it('despacha el click con el seatId al elegir un asiento available', async () => {
    // Given: un asiento disponible
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={onSeatClick} />,
    )

    // When: el usuario hace click
    await usuario.click(screen.getByRole('button', { name: 'Fila 1, columna 1' }))

    // Then: se notifica el seatId elegido
    expect(onSeatClick).toHaveBeenCalledWith('sea-001')
  })

  it('permite seleccionar un asiento available con teclado (Enter/Espacio) — Context.md 10, accesibilidad', async () => {
    // Given: un asiento disponible enfocado
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={onSeatClick} />,
    )
    const boton = screen.getByRole('button', { name: 'Fila 1, columna 1' })
    boton.focus()

    // When: presiona Enter
    await usuario.keyboard('{Enter}')

    // Then: se notifica el seatId igual que con click
    expect(onSeatClick).toHaveBeenCalledWith('sea-001')
  })

  it('un asiento occupied no es clicable ni alcanzable por teclado (Context.md 5.4)', async () => {
    // Given: un asiento ocupado
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatMapArena seats={asientos} zones={[zonaVip]} selectedSeatId={null} onSeatClick={onSeatClick} />,
    )
    const boton = screen.getByRole('button', { name: 'Fila 1, columna 2 — ocupado' })

    // Then: queda fuera del orden de tabulación y marcado como deshabilitado
    expect(boton).toHaveAttribute('tabindex', '-1')
    expect(boton).toHaveAttribute('aria-disabled', 'true')

    // When: se intenta hacer click de todas formas
    await usuario.click(boton)

    // Then: no se notifica ninguna selección
    expect(onSeatClick).not.toHaveBeenCalled()
  })
})
