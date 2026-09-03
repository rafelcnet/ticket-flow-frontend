import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SeatButton } from './SeatButton'

const zonaVip = { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 }

const asientoDisponible = {
  seatId: 'sea-001',
  row: 1,
  col: 2,
  zone: 'zon-001',
  status: 'available' as const,
}

const asientoOcupado = { ...asientoDisponible, seatId: 'sea-002', status: 'occupied' as const }

describe('SeatButton', () => {
  it('un asiento available es clicable y usa el color de su zona (VIP/Premium/General) como fondo', () => {
    // Given: un asiento disponible de la zona VIP
    // When: se renderiza
    render(
      <SeatButton seat={asientoDisponible} zone={zonaVip} isSelected={false} onSeatClick={vi.fn()} />,
    )
    const boton = screen.getByRole('button', { name: 'Fila 1, columna 2' })

    // Then: no está deshabilitado y refleja el color de la zona
    expect(boton).toBeEnabled()
    expect(boton).toHaveStyle({ backgroundColor: zonaVip.color })
  })

  it('muestra el popover (title) con fila, columna, zona y precio sobre un asiento available', () => {
    // Given: un asiento disponible con zona resuelta
    render(
      <SeatButton seat={asientoDisponible} zone={zonaVip} isSelected={false} onSeatClick={vi.fn()} />,
    )

    // When / Then: el título describe el asiento (SpecSeatMap 3)
    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'Fila 1, Columna 2 — VIP ($150.00)',
    )
  })

  it('despacha el click con el seatId al elegir un asiento available', async () => {
    // Given: un asiento disponible
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatButton seat={asientoDisponible} zone={zonaVip} isSelected={false} onSeatClick={onSeatClick} />,
    )

    // When: el usuario hace click
    await usuario.click(screen.getByRole('button'))

    // Then: se notifica el seatId elegido
    expect(onSeatClick).toHaveBeenCalledWith('sea-001')
  })

  it('un asiento occupied está deshabilitado, sin popover, y no se puede clicar (Context.md 5.4)', async () => {
    // Given: un asiento ocupado
    const usuario = userEvent.setup()
    const onSeatClick = vi.fn()
    render(
      <SeatButton seat={asientoOcupado} zone={zonaVip} isSelected={false} onSeatClick={onSeatClick} />,
    )
    const boton = screen.getByRole('button', { name: 'Fila 1, columna 2 — ocupado' })

    // When: se intenta hacer click de todas formas
    await usuario.click(boton)

    // Then: está deshabilitado, sin título, y el click no dispara nada
    expect(boton).toBeDisabled()
    expect(boton).not.toHaveAttribute('title')
    expect(onSeatClick).not.toHaveBeenCalled()
  })

  it('un asiento selected usa el color naranja de selección, no el color de la zona (Context.md 5.4)', () => {
    // Given: el mismo asiento, ahora marcado como seleccionado
    render(
      <SeatButton seat={asientoDisponible} zone={zonaVip} isSelected onSeatClick={vi.fn()} />,
    )
    const boton = screen.getByRole('button')

    // Then: la selección queda marcada y no se pisa con el color de zona
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    expect(boton).not.toHaveStyle({ backgroundColor: zonaVip.color })
  })
})
