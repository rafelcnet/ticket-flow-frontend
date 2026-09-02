import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../http/http.types'
import { useAuth } from '../../hooks/useAuth'
import { AuthProvider } from '../../state/auth/auth.context'
import { login } from '../../services/auth.service'
import { LoginPage } from './LoginPage'

vi.mock('../../services/auth.service')

/** Expone el estado de la slice `auth` para verificar que el login la actualizó. */
const AuthStateProbe = () => {
  const { state } = useAuth()
  return (
    <p>
      isAuthenticated: {String(state.isAuthenticated)} — user:{' '}
      {state.user?.name ?? 'ninguno'}
    </p>
  )
}

const renderLoginPage = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<AuthStateProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const usuarioValido = { email: 'sofia.hernandez@ticketflow.com', password: 'ticket123' }

const respuestaLoginExitosa = {
  token: 'tok_550e8400-e29b-41d4-a716-446655440000',
  user: {
    id: 'usr-001',
    name: 'Sofía',
    lastname: 'Hernández',
    email: 'sofia.hernandez@ticketflow.com',
    phone: '+525511223344',
  },
}

const enviarFormulario = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.type(screen.getByLabelText('Email'), usuarioValido.email)
  await usuario.type(screen.getByLabelText('Password'), usuarioValido.password)
  await usuario.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('muestra los campos de email y password, y el botón Sign in', () => {
    // Given: el usuario abre la pantalla de login (Context.md 5.2)
    // When: se renderiza la pantalla
    renderLoginPage()

    // Then: están presentes los elementos exigidos por el PRD
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('muestra "Create account" y "Forgot your password?" deshabilitados con badge Soon', () => {
    // Given: funcionalidad futura marcada como // TODO (Context.md 9)
    // When: se renderiza la pantalla
    renderLoginPage()

    // Then: ambos elementos están deshabilitados y llevan el badge "Soon"
    expect(screen.getByRole('button', { name: /Create account/ })).toBeDisabled()
    expect(screen.getAllByText('Soon')).toHaveLength(2)
  })

  it('no envía el formulario si los campos están vacíos, y muestra el error de validación', async () => {
    // Given: el usuario no llenó ningún campo
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: intenta enviar el formulario vacío
    await usuario.click(screen.getByRole('button', { name: 'Sign in' }))

    // Then: se muestra el error de validación y no se llama al servicio de login
    expect(await screen.findByText('El correo es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('muestra sólo el error del campo que falta cuando el otro sí se llenó', async () => {
    // Given: el usuario sólo llena el email
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: envía el formulario sin password
    await usuario.type(screen.getByLabelText('Email'), usuarioValido.email)
    await usuario.click(screen.getByRole('button', { name: 'Sign in' }))

    // Then: sólo se muestra el error de password
    expect(await screen.findByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(screen.queryByText('El correo es obligatorio')).not.toBeInTheDocument()
  })

  it('alterna entre ocultar y mostrar la contraseña al pulsar el botón de alternancia', async () => {
    // Given: el campo de password está oculto por defecto
    const usuario = userEvent.setup()
    renderLoginPage()
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // When: el usuario pulsa "Show"
    await usuario.click(screen.getByRole('button', { name: 'Show' }))

    // Then: el password se vuelve visible y el botón cambia a "Hide"
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument()
  })

  it('inicia sesión, guarda el usuario en la slice auth y redirige a /home (200)', async () => {
    // Given: el backend acepta las credenciales (SpecAuth 2.3)
    vi.mocked(login).mockResolvedValue(respuestaLoginExitosa)
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: el usuario llena el formulario y lo envía
    await enviarFormulario(usuario)

    // Then: se llama al servicio con las credenciales, la slice auth queda poblada y navega a /home
    expect(login).toHaveBeenCalledWith(usuarioValido)
    expect(await screen.findByText(/isAuthenticated: true/)).toBeInTheDocument()
    expect(screen.getByText(/user: Sofía/)).toBeInTheDocument()
  })

  it('muestra el mensaje del backend ante credenciales inválidas, sin navegar (401 INVALID_CREDENTIALS)', async () => {
    // Given: el backend rechaza las credenciales — excepción cerrada (SpecHttp 4.2, SpecAuth 2.4)
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      }),
    )
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: el usuario envía el formulario con credenciales incorrectas
    await enviarFormulario(usuario)

    // Then: se muestra el mensaje inline del backend y el usuario permanece en /login
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
    expect(screen.queryByText(/isAuthenticated: true/)).not.toBeInTheDocument()
  })

  it('muestra un mensaje genérico si la falla no es un error de la API (por ejemplo, de red)', async () => {
    // Given: la petición falla por una razón ajena al contrato de errores del backend
    vi.mocked(login).mockRejectedValue(new TypeError('Failed to fetch'))
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: el usuario envía el formulario
    await enviarFormulario(usuario)

    // Then: se muestra un mensaje genérico, no un error técnico
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo iniciar sesión. Inténtalo de nuevo.',
    )
  })

  it('deshabilita el botón Sign in y muestra el estado de envío mientras la petición está en curso', async () => {
    // Given: el backend tarda en responder
    let resolverLogin: (value: typeof respuestaLoginExitosa) => void = () => {}
    vi.mocked(login).mockReturnValue(
      new Promise((resolve) => {
        resolverLogin = resolve
      }),
    )
    const usuario = userEvent.setup()
    renderLoginPage()

    // When: el usuario envía el formulario
    await enviarFormulario(usuario)

    // Then: el botón se deshabilita y cambia su texto mientras espera la respuesta
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()

    // Cleanup: se resuelve la petición para no dejar un timer pendiente
    resolverLogin(respuestaLoginExitosa)
    await screen.findByText(/isAuthenticated: true/)
  })
})
