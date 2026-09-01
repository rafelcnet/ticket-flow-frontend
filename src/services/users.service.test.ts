import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { getProfile } from './users.service'

vi.mock('../http/http.client')

describe('users.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getProfile', () => {
    it('devuelve el perfil del usuario autenticado (200)', async () => {
      // Given: el backend confirma la identidad resuelta por el token (SpecHttp 7.4)
      vi.mocked(httpClient.get).mockResolvedValue({
        id: 'usr-001',
        name: 'Sofía',
        lastname: 'Hernández',
        email: 'sofia.hernandez@ticketflow.com',
        phone: '+525511223344',
      })

      // When: se pide el perfil autenticado
      const profile = await getProfile()

      // Then: se llama a GET /users/me y se devuelve el perfil validado
      expect(httpClient.get).toHaveBeenCalledWith('/users/me')
      expect(profile.email).toBe('sofia.hernandez@ticketflow.com')
    })

    it('propaga UNAUTHORIZED cuando el token es inválido o falta (401)', async () => {
      // Given: el interceptor global ya habrá limpiado el token, pero el error igual se propaga
      const error = Object.assign(new Error('Invalid or missing token'), {
        code: 'UNAUTHORIZED',
        status: 401,
      })
      vi.mocked(httpClient.get).mockRejectedValue(error)

      // When: se pide el perfil sin una sesión válida
      const call = getProfile()

      // Then: el error llega tal cual a quien hizo la llamada
      await expect(call).rejects.toBe(error)
    })

    it('rechaza la respuesta si el backend devuelve un perfil con campos faltantes', async () => {
      // Given: la respuesta no cumple el contrato de UserSchema
      vi.mocked(httpClient.get).mockResolvedValue({ id: 'usr-001' })

      // When: se procesa esa respuesta
      const call = getProfile()

      // Then: la validación de Zod detiene el flujo
      await expect(call).rejects.toThrow()
    })
  })
})
