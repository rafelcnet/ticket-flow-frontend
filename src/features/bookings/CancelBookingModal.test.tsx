import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CancelBookingModal } from './CancelBookingModal'

describe('CancelBookingModal', () => {
  it('muestra el texto de confirmación literal de Context.md 5.5', () => {
    // Given / When: se abre el modal de cancelación
    render(<CancelBookingModal onConfirm={vi.fn()} onDismiss={vi.fn()} />)

    // Then: se ve el texto exacto del PRD
    expect(
      screen.getByText('¿Seguro que quieres cancelar esta reservación?'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dispara onConfirm al pulsar "Sí, cancelar" (CANCEL_CONFIRM, SpecBookings 4.3)', async () => {
    // Given: el modal abierto
    const usuario = userEvent.setup()
    const onConfirm = vi.fn()
    render(<CancelBookingModal onConfirm={onConfirm} onDismiss={vi.fn()} />)

    // When: confirma la cancelación
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    // Then: se notifica la confirmación
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('dispara onDismiss al pulsar "No, mantener" (CANCEL_DISMISS, SpecBookings 4.3)', async () => {
    // Given: el modal abierto
    const usuario = userEvent.setup()
    const onDismiss = vi.fn()
    render(<CancelBookingModal onConfirm={vi.fn()} onDismiss={onDismiss} />)

    // When: cierra sin confirmar
    await usuario.click(screen.getByRole('button', { name: 'No, mantener' }))

    // Then: se notifica el cierre
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dispara onDismiss al hacer click fuera del modal (en el fondo)', async () => {
    // Given: el modal abierto
    const usuario = userEvent.setup()
    const onDismiss = vi.fn()
    render(<CancelBookingModal onConfirm={vi.fn()} onDismiss={onDismiss} />)

    // When: hace click fuera del cuadro de diálogo
    await usuario.click(screen.getByRole('dialog').parentElement as HTMLElement)

    // Then: se notifica el cierre, igual que "No, mantener"
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('no dispara onDismiss al hacer click dentro del modal', async () => {
    // Given: el modal abierto
    const usuario = userEvent.setup()
    const onDismiss = vi.fn()
    render(<CancelBookingModal onConfirm={vi.fn()} onDismiss={onDismiss} />)

    // When: hace click dentro del cuadro de diálogo, fuera de los botones
    await usuario.click(screen.getByRole('dialog'))

    // Then: el click no se propaga como un cierre
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
