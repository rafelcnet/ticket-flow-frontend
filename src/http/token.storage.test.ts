import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, hasToken, saveToken } from './token.storage'

describe('token.storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveToken', () => {
    it('guarda el token en localStorage bajo la clave de sesión', () => {
      // Given: no hay ningún token guardado
      // When: se guarda un token recibido del login
      saveToken('tok_550e8400-e29b-41d4-a716-446655440000')

      // Then: localStorage contiene el valor guardado
      expect(localStorage.getItem('ticketflow_token')).toBe(
        'tok_550e8400-e29b-41d4-a716-446655440000',
      )
    })

    it('sobrescribe un token previo al guardar uno nuevo', () => {
      // Given: ya existe un token de una sesión anterior
      saveToken('tok_viejo')

      // When: se guarda un token nuevo
      saveToken('tok_nuevo')

      // Then: sólo queda el token más reciente
      expect(getToken()).toBe('tok_nuevo')
    })
  })

  describe('getToken', () => {
    it('devuelve el token guardado cuando existe una sesión activa', () => {
      // Given: hay un token guardado
      saveToken('tok_abc123')

      // When: se consulta el token
      const token = getToken()

      // Then: se obtiene el mismo valor guardado
      expect(token).toBe('tok_abc123')
    })

    it('devuelve null cuando no hay ninguna sesión iniciada', () => {
      // Given: no se ha guardado ningún token
      // When: se consulta el token
      const token = getToken()

      // Then: no hay sesión activa
      expect(token).toBeNull()
    })
  })

  describe('clearToken', () => {
    it('elimina el token guardado al cerrar sesión', () => {
      // Given: hay una sesión activa
      saveToken('tok_abc123')

      // When: se limpia el token
      clearToken()

      // Then: ya no queda ningún token guardado
      expect(getToken()).toBeNull()
    })

    it('no falla si se llama cuando ya no hay ningún token guardado', () => {
      // Given: no hay sesión activa
      // When / Then: limpiar el token no lanza ningún error
      expect(() => clearToken()).not.toThrow()
    })
  })

  describe('hasToken', () => {
    it('devuelve true cuando existe una sesión activa', () => {
      // Given: hay un token guardado
      saveToken('tok_abc123')

      // When: se comprueba si hay sesión
      // Then: la respuesta es afirmativa
      expect(hasToken()).toBe(true)
    })

    it('devuelve false cuando no hay ninguna sesión iniciada', () => {
      // Given: no hay ningún token guardado
      // When: se comprueba si hay sesión
      // Then: la respuesta es negativa
      expect(hasToken()).toBe(false)
    })

    it('devuelve false después de cerrar sesión', () => {
      // Given: había una sesión activa que se cerró
      saveToken('tok_abc123')
      clearToken()

      // When: se comprueba si hay sesión
      // Then: ya no se detecta ninguna sesión
      expect(hasToken()).toBe(false)
    })
  })
})
