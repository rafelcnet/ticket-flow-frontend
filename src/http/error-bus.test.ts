import { describe, expect, it, vi } from 'vitest'
import { notifyGlobalError, subscribeToGlobalErrors } from './error-bus'

describe('error-bus', () => {
  it('notifica a un suscriptor con el mensaje enviado', () => {
    // Given: un componente suscrito al canal de errores globales
    const listener = vi.fn()
    subscribeToGlobalErrors(listener)

    // When: el interceptor de response notifica un error
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')

    // Then: el suscriptor recibe una notificación con ese mensaje y un id único
    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Ocurrió un error inesperado. Intenta nuevamente.',
      }),
    )
  })

  it('notifica a todos los suscriptores activos', () => {
    // Given: dos componentes suscritos al mismo canal
    const primero = vi.fn()
    const segundo = vi.fn()
    subscribeToGlobalErrors(primero)
    subscribeToGlobalErrors(segundo)

    // When: se emite una notificación
    notifyGlobalError('No tienes permiso para realizar esta acción')

    // Then: ambos reciben la notificación
    expect(primero).toHaveBeenCalledOnce()
    expect(segundo).toHaveBeenCalledOnce()
  })

  it('genera un id distinto por cada notificación', () => {
    // Given: un suscriptor activo
    const listener = vi.fn()
    subscribeToGlobalErrors(listener)

    // When: se emiten dos notificaciones seguidas
    notifyGlobalError('Primer error')
    notifyGlobalError('Segundo error')

    // Then: cada una lleva un identificador único, para poder descartarlas por separado
    const [primeraLlamada] = listener.mock.calls[0]
    const [segundaLlamada] = listener.mock.calls[1]
    expect(primeraLlamada.id).not.toBe(segundaLlamada.id)
  })

  it('deja de notificar a un suscriptor después de darse de baja', () => {
    // Given: un componente suscrito que luego se desmonta
    const listener = vi.fn()
    const unsubscribe = subscribeToGlobalErrors(listener)
    unsubscribe()

    // When: se emite una notificación tras la baja
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')

    // Then: el suscriptor ya no recibe nada
    expect(listener).not.toHaveBeenCalled()
  })

  it('no falla si se notifica sin ningún suscriptor activo', () => {
    // Given: ningún componente está suscrito
    // When / Then: emitir una notificación no lanza ningún error
    expect(() => notifyGlobalError('Mensaje sin destinatario')).not.toThrow()
  })
})
