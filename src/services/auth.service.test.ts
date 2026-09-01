import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as tokenStorage from '../http/token.storage'
import { httpClient } from '../http/http.client'
import { login, logout } from './auth.service'

vi.mock('../http/http.client')
vi.mock('../http/token.storage')

describe('auth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    it('guarda el token recibido y devuelve el usuario autenticado (200)', async () => {
      // Given: el backend acepta las credenciales (SpecHttp 7.2)
      vi.mocked(httpClient.post).mockResolvedValue({
        token: 'tok_550e8400-e29b-41d4-a716-446655440000',
        user: {
          id: 'usr-001',
          name: 'Sofía',
          lastname: 'Hernández',
          email: 'sofia.hernandez@ticketflow.com',
          phone: '+525511223344',
        },
      })

      // When: el usuario inicia sesión con sus credenciales
      const result = await login({
        email: 'sofia.hernandez@ticketflow.com',
        password: 'ticket123',
      })

      // Then: se llama a POST /auth/login, se guarda el token y se devuelve el usuario
      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'sofia.hernandez@ticketflow.com',
        password: 'ticket123',
      })
      expect(tokenStorage.saveToken).toHaveBeenCalledWith(
        'tok_550e8400-e29b-41d4-a716-446655440000',
      )
      expect(result.user.name).toBe('Sofía')
    })

    it('propaga INVALID_CREDENTIALS sin guardar ningún token (401)', async () => {
      // Given: el backend rechaza el email o password (SpecHttp 7.2)
      const error = Object.assign(new Error('Invalid email or password'), {
        code: 'INVALID_CREDENTIALS',
        status: 401,
      })
      vi.mocked(httpClient.post).mockRejectedValue(error)

      // When: el usuario intenta iniciar sesión con credenciales incorrectas
      const call = login({
        email: 'sofia.hernandez@ticketflow.com',
        password: 'incorrecta',
      })

      // Then: el error llega tal cual y no se guarda ningún token
      await expect(call).rejects.toBe(error)
      expect(tokenStorage.saveToken).not.toHaveBeenCalled()
    })

    it('rechaza la respuesta si el backend devuelve un usuario con una forma inesperada', async () => {
      // Given: la respuesta del backend no cumple el contrato de LoginResponseSchema
      vi.mocked(httpClient.post).mockResolvedValue({
        token: 'tok_abc',
        user: { id: 'usr-001' },
      })

      // When: se procesa esa respuesta
      const call = login({
        email: 'sofia.hernandez@ticketflow.com',
        password: 'ticket123',
      })

      // Then: la validación de Zod detiene el flujo antes de guardar el token
      await expect(call).rejects.toThrow()
      expect(tokenStorage.saveToken).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('limpia el token tras cerrar sesión correctamente (200)', async () => {
      // Given: el backend confirma el cierre de sesión (SpecHttp 7.3)
      vi.mocked(httpClient.post).mockResolvedValue({ message: 'Logged out successfully' })

      // When: el usuario cierra sesión
      await logout()

      // Then: se llama a POST /auth/logout y se limpia el token localmente
      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(tokenStorage.clearToken).toHaveBeenCalledOnce()
    })

    it('no limpia el token si la petición de logout falla', async () => {
      // Given: el token ya era inválido cuando se pulsó Logout (SpecAuth 3.3) —
      // el interceptor global de 401 ya se encarga de limpiar la sesión en ese caso
      const error = Object.assign(new Error('Invalid or missing token'), {
        code: 'UNAUTHORIZED',
        status: 401,
      })
      vi.mocked(httpClient.post).mockRejectedValue(error)

      // When: se intenta cerrar sesión
      const call = logout()

      // Then: auth.service no duplica la limpieza — el interceptor ya la hizo
      await expect(call).rejects.toBe(error)
      expect(tokenStorage.clearToken).not.toHaveBeenCalled()
    })
  })
})
