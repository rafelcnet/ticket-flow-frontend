import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { clearToken, saveToken } from '../http/token.storage'
import { RequireAuth } from './RequireAuth'

const renderConGuard = () =>
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<p>Contenido protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('RequireAuth', () => {
  afterEach(() => {
    clearToken()
  })

  it('renderiza la ruta protegida cuando hay una sesión activa (Context.md 8.5)', () => {
    // Given: el usuario ya inició sesión
    saveToken('tok_abc123')

    // When: intenta entrar a una ruta protegida
    renderConGuard()

    // Then: ve el contenido de esa ruta
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('redirige al login cuando no hay ninguna sesión activa', () => {
    // Given: no hay ningún token guardado
    // When: intenta entrar a una ruta protegida
    renderConGuard()

    // Then: se le redirige al login en vez de mostrar el contenido
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })
})
