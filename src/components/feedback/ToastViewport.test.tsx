import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyGlobalError } from '../../http/error-bus'
import { ToastViewport } from './ToastViewport'

describe('ToastViewport', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('no muestra nada mientras no ocurre ningún error global', () => {
    // Given: la aplicación funciona con normalidad
    // When: se monta el visor de toasts
    render(<ToastViewport />)

    // Then: no hay ningún mensaje visible
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('muestra el mensaje cuando el interceptor notifica un error 403', async () => {
    // Given: el visor está montado, escuchando el canal de errores globales
    render(<ToastViewport />)

    // When: el interceptor de response notifica un 403 (SpecHttp 4.2)
    notifyGlobalError('No tienes permiso para realizar esta acción')

    // Then: el usuario ve el mensaje genérico
    expect(
      await screen.findByText('No tienes permiso para realizar esta acción'),
    ).toBeInTheDocument()
  })

  it('apila varios toasts si ocurre más de un error antes de descartarlos', async () => {
    // Given: el visor está montado
    render(<ToastViewport />)

    // When: ocurren dos errores globales seguidos
    notifyGlobalError('No tienes permiso para realizar esta acción')
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')

    // Then: ambos mensajes son visibles a la vez
    expect(
      await screen.findByText('No tienes permiso para realizar esta acción'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ocurrió un error inesperado. Intenta nuevamente.'),
    ).toBeInTheDocument()
  })

  it('permite cerrar un toast manualmente con el botón de descarte', async () => {
    // Given: hay un toast visible
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ToastViewport />)
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')
    const mensaje = await screen.findByText(
      'Ocurrió un error inesperado. Intenta nuevamente.',
    )

    // When: el usuario pulsa el botón de cerrar
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Then: el toast desaparece
    expect(mensaje).not.toBeInTheDocument()
  })

  it('descarta el toast automáticamente pasado el tiempo de espera', async () => {
    // Given: hay un toast visible
    render(<ToastViewport />)
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')
    await screen.findByText('Ocurrió un error inesperado. Intenta nuevamente.')

    // When: transcurre el tiempo de auto-descarte
    vi.advanceTimersByTime(6000)

    // Then: el toast se retira solo, sin intervención del usuario
    await waitFor(() =>
      expect(
        screen.queryByText('Ocurrió un error inesperado. Intenta nuevamente.'),
      ).not.toBeInTheDocument(),
    )
  })
})
