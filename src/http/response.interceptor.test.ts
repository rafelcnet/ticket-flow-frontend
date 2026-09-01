import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as errorBus from './error-bus'
import * as tokenStorage from './token.storage'
import { applyResponseInterceptor } from './response.interceptor'
import { ApiError } from './http.types'

vi.mock('./error-bus')
vi.mock('./token.storage')

/** Simula una `Response` de `fetch` con lo que el interceptor consulta. */
const mockResponse = (status: number, body: unknown, ok = status < 400) =>
  ({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response

describe('applyResponseInterceptor', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.resetAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: vi.fn() },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('devuelve el cuerpo parseado cuando la respuesta es exitosa (200)', async () => {
    // Given: el backend responde 200 con un cuerpo JSON
    const response = mockResponse(200, { status: 'ok' })

    // When: se aplica el interceptor de response
    const result = await applyResponseInterceptor(response, {
      method: 'GET',
      path: '/health',
    })

    // Then: se propaga el dato ya parseado, sin transformar
    expect(result).toEqual({ status: 'ok' })
  })

  it('devuelve undefined en una respuesta 204 sin cuerpo', async () => {
    // Given: el backend responde sin contenido
    const response = mockResponse(204, null)

    // When: se aplica el interceptor de response
    const result = await applyResponseInterceptor(response, {
      method: 'POST',
      path: '/auth/logout',
    })

    // Then: no se intenta parsear un cuerpo inexistente
    expect(result).toBeUndefined()
    expect(response.json).not.toHaveBeenCalled()
  })

  it('limpia el token y redirige al login ante un 401 fuera del login (UNAUTHORIZED)', async () => {
    // Given: una petición protegida cuyo token ya expiró
    const response = mockResponse(401, {
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing token',
    })

    // When: se aplica el interceptor de response
    const call = applyResponseInterceptor(response, {
      method: 'GET',
      path: '/bookings',
    })

    // Then: se propaga el error de negocio y, además, se limpia la sesión y se redirige
    await expect(call).rejects.toThrow(ApiError)
    expect(tokenStorage.clearToken).toHaveBeenCalledOnce()
    expect(window.location.assign).toHaveBeenCalledWith('/login')
  })

  it('propaga INVALID_CREDENTIALS de POST /auth/login sin limpiar token ni redirigir', async () => {
    // Given: un intento de login con credenciales incorrectas (excepción cerrada, SpecHttp 4.2)
    const response = mockResponse(401, {
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    })

    // When: se aplica el interceptor de response sobre esa petición específica
    const call = applyResponseInterceptor(response, {
      method: 'POST',
      path: '/auth/login',
    })

    // Then: el error llega intacto al componente de login, sin efectos globales
    await expect(call).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(tokenStorage.clearToken).not.toHaveBeenCalled()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('aplica la regla global de 401 a un GET /auth/login hipotético, porque la excepción es sólo para POST', async () => {
    // Given: la excepción cerrada exige method === 'POST' además del path
    const response = mockResponse(401, {
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing token',
    })

    // When: se aplica el interceptor con el mismo path pero otro verbo
    const call = applyResponseInterceptor(response, {
      method: 'GET',
      path: '/auth/login',
    })

    // Then: no aplica la excepción — se limpia el token y se redirige como cualquier 401 global
    await expect(call).rejects.toThrow(ApiError)
    expect(tokenStorage.clearToken).toHaveBeenCalledOnce()
    expect(window.location.assign).toHaveBeenCalledWith('/login')
  })

  it('muestra un toast genérico de permisos ante un 403, sin tocar la sesión', async () => {
    // Given: el usuario intenta una acción para la que no tiene permiso
    const response = mockResponse(403, {
      error: 'FORBIDDEN',
      message: 'Forbidden',
    })

    // When: se aplica el interceptor de response
    const call = applyResponseInterceptor(response, {
      method: 'POST',
      path: '/bookings',
    })

    // Then: se notifica el mensaje genérico y se propaga el error, sin afectar el token
    await expect(call).rejects.toThrow(ApiError)
    expect(errorBus.notifyGlobalError).toHaveBeenCalledWith(
      'No tienes permiso para realizar esta acción',
    )
    expect(tokenStorage.clearToken).not.toHaveBeenCalled()
  })

  it('muestra un toast genérico de error inesperado ante un 500', async () => {
    // Given: el backend falla de forma inesperada
    const response = mockResponse(500, {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error',
    })

    // When: se aplica el interceptor de response
    const call = applyResponseInterceptor(response, {
      method: 'GET',
      path: '/events',
    })

    // Then: se notifica el mensaje genérico de error del servidor
    await expect(call).rejects.toThrow(ApiError)
    expect(errorBus.notifyGlobalError).toHaveBeenCalledWith(
      'Ocurrió un error inesperado. Intenta nuevamente.',
    )
  })

  it.each([
    ['400 VALIDATION_ERROR', 400, 'VALIDATION_ERROR', 'email and password are required'],
    ['402 PAYMENT_DECLINED', 402, 'PAYMENT_DECLINED', 'Your payment was declined.'],
    ['404 EVENT_NOT_FOUND', 404, 'EVENT_NOT_FOUND', 'Event not found'],
    [
      '409 SEAT_UNAVAILABLE',
      409,
      'SEAT_UNAVAILABLE',
      'The selected seat is not available',
    ],
  ])(
    'propaga %s sin ninguna acción global (sin toast, sin tocar la sesión)',
    async (_caso, status, code, message) => {
      // Given: un código que el interceptor no maneja globalmente (SpecHttp 4.2)
      const response = mockResponse(status, { error: code, message })

      // When: se aplica el interceptor de response
      const call = applyResponseInterceptor(response, {
        method: 'POST',
        path: '/bookings',
      })

      // Then: el service/feature que hizo la llamada es quien decide qué hacer
      await expect(call).rejects.toMatchObject({ status, code })
      expect(errorBus.notifyGlobalError).not.toHaveBeenCalled()
      expect(tokenStorage.clearToken).not.toHaveBeenCalled()
      expect(window.location.assign).not.toHaveBeenCalled()
    },
  )
})
