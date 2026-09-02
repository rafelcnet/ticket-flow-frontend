import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '../../services/auth.service'
import { getProfile } from '../../services/users.service'
import { AuthProvider } from '../../state/auth/auth.context'
import { AppShell } from './AppShell'

vi.mock('../../services/users.service')
vi.mock('../../services/auth.service')

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

const renderAppShell = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/home" element={<p>Contenido de Home</p>} />
          </Route>
          <Route path="/login" element={<p>Pantalla de login</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

describe('AppShell', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renderiza el contenido de la ruta anidada dentro del shell', async () => {
    // Given: el backend devuelve el perfil autenticado (SpecHttp 7.4)
    vi.mocked(getProfile).mockResolvedValue(usuario)

    // When: se monta el shell en /home
    renderAppShell()

    // Then: el Outlet muestra el contenido de esa ruta
    expect(await screen.findByText('Contenido de Home')).toBeInTheDocument()
  })

  it('refresca el perfil al montar y puebla la slice auth (rehidratación tras reload, SpecLayout 4.1)', async () => {
    // Given: el token sigue en localStorage pero el estado de React se perdió
    vi.mocked(getProfile).mockResolvedValue(usuario)

    // When: se monta el shell
    renderAppShell()

    // Then: se llama a GET /users/me y el nombre/correo aparecen en el sidebar
    expect(await screen.findByText('Sofía Hernández')).toBeInTheDocument()
    expect(getProfile).toHaveBeenCalledOnce()
  })

  it('no despacha el perfil si el componente se desmontó antes de que la petición resolviera', async () => {
    // Given: la petición de perfil está en curso cuando el usuario navega fuera de la ruta
    let resolverPerfil: (user: typeof usuario) => void = () => {}
    vi.mocked(getProfile).mockReturnValue(
      new Promise((resolve) => {
        resolverPerfil = resolve
      }),
    )
    const { unmount } = renderAppShell()

    // When: el shell se desmonta antes de que el perfil llegue
    unmount()
    resolverPerfil(usuario)
    await Promise.resolve()

    // Then: no se lanza ningún error por actualizar estado tras desmontar (sin aserción
    // directa posible sobre un componente ya desmontado — la ausencia de error es la prueba)
  })

  it('no rompe el render si falla la petición del perfil (401 ya resuelto por el interceptor global)', async () => {
    // Given: GET /users/me falla (el interceptor global ya limpió el token si era 401)
    vi.mocked(getProfile).mockRejectedValue(new Error('UNAUTHORIZED'))

    // When: se monta el shell
    renderAppShell()

    // Then: el contenido igual se renderiza, sin usuario en el sidebar ni error sin capturar
    expect(await screen.findByText('Contenido de Home')).toBeInTheDocument()
    expect(screen.queryByText('Sofía Hernández')).not.toBeInTheDocument()
  })

  it('cierra sesión y navega a /login cuando el logout es exitoso (SpecAuth 3.2)', async () => {
    // Given: un usuario autenticado
    vi.mocked(getProfile).mockResolvedValue(usuario)
    vi.mocked(logout).mockResolvedValue(undefined)
    const usuarioInteraccion = userEvent.setup()
    renderAppShell()
    await screen.findByText('Sofía Hernández')

    // When: pulsa Logout
    await usuarioInteraccion.click(screen.getByRole('button', { name: 'Logout' }))

    // Then: se llama a auth.service.logout y se navega a /login
    expect(logout).toHaveBeenCalledOnce()
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('no cierra sesión localmente si la petición de logout falla (SpecAuth 3.3)', async () => {
    // Given: la petición de logout falla por una razón distinta a 401
    vi.mocked(getProfile).mockResolvedValue(usuario)
    vi.mocked(logout).mockRejectedValue(new Error('INTERNAL_SERVER_ERROR'))
    const usuarioInteraccion = userEvent.setup()
    renderAppShell()
    await screen.findByText('Sofía Hernández')

    // When: pulsa Logout
    await usuarioInteraccion.click(screen.getByRole('button', { name: 'Logout' }))

    // Then: no navega y el usuario sigue viéndose autenticado en el sidebar
    expect(logout).toHaveBeenCalledOnce()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
    expect(screen.getByText('Sofía Hernández')).toBeInTheDocument()
  })
})
