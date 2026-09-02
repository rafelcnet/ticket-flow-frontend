import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'
import { AuthContext, AuthProvider } from './auth.context'

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

/** Consumidor mínimo que expone el estado y permite despachar acciones. */
const Consumer = () => {
  const context = useContext(AuthContext)
  if (!context) return null
  const { state, dispatch } = context
  return (
    <div>
      <p>isAuthenticated: {String(state.isAuthenticated)}</p>
      <button
        onClick={() => dispatch({ type: 'LOGIN_SUCCESS', payload: { user: usuario } })}
      >
        login
      </button>
      <button onClick={() => dispatch({ type: 'LOGOUT' })}>logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  it('renderiza a sus hijos', () => {
    // Given / When: se monta el provider con contenido dentro
    render(
      <AuthProvider>
        <p>contenido hijo</p>
      </AuthProvider>,
    )

    // Then: el contenido se renderiza normalmente
    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })

  it('expone el estado inicial de la slice auth a sus consumidores', () => {
    // Given: ningún login ha ocurrido todavía
    // When: se monta el provider
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    // Then: el consumidor ve el estado inicial sin sesión
    expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument()
  })

  it('propaga las acciones despachadas por un consumidor a todo el árbol', async () => {
    // Given: un consumidor con acceso al dispatch de la slice
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    // When: despacha LOGIN_SUCCESS
    await user.click(screen.getByRole('button', { name: 'login' }))

    // Then: el nuevo estado se refleja de inmediato
    expect(screen.getByText('isAuthenticated: true')).toBeInTheDocument()

    // When: despacha LOGOUT
    await user.click(screen.getByRole('button', { name: 'logout' }))

    // Then: vuelve al estado sin sesión
    expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument()
  })
})
