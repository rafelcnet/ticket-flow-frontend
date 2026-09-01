import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as tokenStorage from './token.storage'
import { applyRequestInterceptor } from './request.interceptor'

vi.mock('./token.storage')

describe('applyRequestInterceptor', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('adjunta el header Authorization cuando hay una sesión activa', () => {
    // Given: existe un token guardado
    vi.mocked(tokenStorage.getToken).mockReturnValue('tok_abc123')
    const headers = new Headers()

    // When: se aplica el interceptor de request
    const result = applyRequestInterceptor(headers)

    // Then: la petición sale con el token como Bearer
    expect(result.get('Authorization')).toBe('Bearer tok_abc123')
  })

  it('no adjunta ningún header Authorization cuando no hay sesión', () => {
    // Given: no hay ningún token guardado (por ejemplo, antes del login)
    vi.mocked(tokenStorage.getToken).mockReturnValue(null)
    const headers = new Headers()

    // When: se aplica el interceptor de request
    const result = applyRequestInterceptor(headers)

    // Then: la petición se envía sin header de autorización, sin fallar
    expect(result.has('Authorization')).toBe(false)
  })

  it('devuelve la misma instancia de headers recibida, con las modificaciones aplicadas', () => {
    // Given: hay una sesión activa y unos headers con un valor previo
    vi.mocked(tokenStorage.getToken).mockReturnValue('tok_abc123')
    const headers = new Headers({ 'Content-Type': 'application/json' })

    // When: se aplica el interceptor de request
    const result = applyRequestInterceptor(headers)

    // Then: se conservan los headers previos y se añade el nuevo
    expect(result.get('Content-Type')).toBe('application/json')
    expect(result.get('Authorization')).toBe('Bearer tok_abc123')
  })
})
