import { describe, expect, it } from 'vitest'
import { authReducer, initialAuthState, type AuthAction } from './auth.reducer'

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

describe('authReducer', () => {
  it('el estado inicial es no autenticado, sin usuario', () => {
    // Given / When: el estado inicial de la slice auth (SpecState 2.1)
    // Then: no hay sesión activa
    expect(initialAuthState).toEqual({ user: null, isAuthenticated: false })
  })

  it('LOGIN_SUCCESS guarda el usuario y marca la sesión como autenticada', () => {
    // Given: un estado sin sesión
    // When: se despacha LOGIN_SUCCESS con el usuario recibido del login (SpecState 2.2)
    const result = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCESS',
      payload: { user: usuario },
    })

    // Then: la slice queda poblada con ese usuario
    expect(result).toEqual({ user: usuario, isAuthenticated: true })
  })

  it('LOGOUT limpia el usuario y marca la sesión como no autenticada', () => {
    // Given: una sesión activa
    const estadoAutenticado = { user: usuario, isAuthenticated: true }

    // When: se despacha LOGOUT (SpecState 2.2)
    const result = authReducer(estadoAutenticado, { type: 'LOGOUT' })

    // Then: la slice vuelve al estado sin sesión
    expect(result).toEqual({ user: null, isAuthenticated: false })
  })

  it('SESSION_EXPIRED limpia la sesión igual que LOGOUT (401 forzado, SpecState 2.2)', () => {
    // Given: una sesión activa que el interceptor global fuerza a cerrar
    const estadoAutenticado = { user: usuario, isAuthenticated: true }

    // When: se despacha SESSION_EXPIRED
    const result = authReducer(estadoAutenticado, { type: 'SESSION_EXPIRED' })

    // Then: el efecto es idéntico al de LOGOUT
    expect(result).toEqual({ user: null, isAuthenticated: false })
  })

  it('ignora una acción desconocida y devuelve el mismo estado', () => {
    // Given: un estado cualquiera
    const estado = { user: usuario, isAuthenticated: true }
    const accionDesconocida = { type: 'ACCION_INEXISTENTE' } as unknown as AuthAction

    // When: se despacha una acción fuera de la FSM
    const result = authReducer(estado, accionDesconocida)

    // Then: el estado no cambia
    expect(result).toBe(estado)
  })
})
