import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useAuth } from '../../../hooks/useAuth'
import { usePurchase } from '../../../hooks/usePurchase'
import { AuthProvider } from '../../../state/auth/auth.context'
import { PurchaseProvider } from '../../../state/purchase/purchase.context'
import { YourDetailsStep } from './YourDetailsStep'

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

/** Puebla la slice auth con un usuario ya autenticado, sin pasar por login real. */
const SeedAuth = () => {
  const { dispatch } = useAuth()
  return (
    <button
      onClick={() => dispatch({ type: 'LOGIN_SUCCESS', payload: { user: usuario } })}
    >
      seed-auth
    </button>
  )
}

const PurchaseStateProbe = () => {
  const { state } = usePurchase()
  return <p>currentStep: {state.currentStep}</p>
}

/**
 * `YourDetailsStep` lee la slice `auth` sólo en el `useState` inicial — por
 * eso el perfil debe sembrarse ANTES de montar el formulario, no después
 * (un `dispatch` posterior no reescribe un estado local ya inicializado).
 */
const Harness = ({ mostrarFormulario }: { mostrarFormulario: boolean }) => (
  <AuthProvider>
    <PurchaseProvider>
      <SeedAuth />
      {mostrarFormulario && <YourDetailsStep />}
      <PurchaseStateProbe />
    </PurchaseProvider>
  </AuthProvider>
)

const renderConSesionSembrada = async (
  usuarioInteraccion: ReturnType<typeof userEvent.setup>,
) => {
  const { rerender } = render(<Harness mostrarFormulario={false} />)
  await usuarioInteraccion.click(screen.getByRole('button', { name: 'seed-auth' }))
  rerender(<Harness mostrarFormulario={true} />)
}

describe('YourDetailsStep', () => {
  it('prellena el formulario con el perfil ya disponible en la slice auth (Context.md 5.4 Paso 2)', async () => {
    // Given: el usuario ya está autenticado, con su perfil en la slice auth
    const usuarioInteraccion = userEvent.setup()

    // When: se monta el formulario del Paso 2
    await renderConSesionSembrada(usuarioInteraccion)

    // Then: los cuatro campos aparecen prellenados — sin un segundo GET /users/me
    expect(screen.getByDisplayValue('Sofía')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hernández')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sofia.hernandez@ticketflow.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+525511223344')).toBeInTheDocument()
  })

  it('no puede avanzar si deja algún campo vacío (Context.md 5.4: todos obligatorios)', async () => {
    // Given: el formulario sin ningún dato precargado (sin sesión sembrada)
    const usuario = userEvent.setup()
    render(<Harness mostrarFormulario />)

    // When: intenta enviar con los campos vacíos
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: se muestran los errores de validación y no avanza de paso
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El apellido es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.queryByText('currentStep: step-3-select-seat')).not.toBeInTheDocument()
  })

  it('permite corregir un dato precargado antes de avanzar', async () => {
    // Given: el usuario ya está autenticado, con el formulario prellenado
    const usuarioInteraccion = userEvent.setup()
    await renderConSesionSembrada(usuarioInteraccion)

    // When: corrige el teléfono y avanza
    const telefono = screen.getByDisplayValue('+525511223344')
    await usuarioInteraccion.clear(telefono)
    await usuarioInteraccion.type(telefono, '+525599887766')
    await usuarioInteraccion.click(screen.getByRole('button', { name: 'Next' }))

    // Then: la slice avanza al Paso 3 (SpecPurchase 2.1: CONFIRM_DETAILS)
    expect(await screen.findByText('currentStep: step-3-select-seat')).toBeInTheDocument()
  })

  it('avanza al Paso 3 y guarda los datos de contacto al enviar un formulario válido', async () => {
    // Given: el formulario ya tiene datos válidos (sembrados desde auth)
    const usuarioInteraccion = userEvent.setup()
    await renderConSesionSembrada(usuarioInteraccion)

    // When: el usuario pulsa Next sin cambiar nada
    await usuarioInteraccion.click(screen.getByRole('button', { name: 'Next' }))

    // Then: la slice guarda los datos y avanza
    expect(await screen.findByText('currentStep: step-3-select-seat')).toBeInTheDocument()
  })

  it('vuelve al Paso 1 al pulsar Back', async () => {
    // Given: el formulario del Paso 2
    const usuario = userEvent.setup()
    render(<Harness mostrarFormulario />)

    // When: pulsa Back
    await usuario.click(screen.getByRole('button', { name: 'Back' }))

    // Then: la slice regresa al Paso 1 (GO_BACK, SpecPurchase 2.1)
    expect(
      await screen.findByText('currentStep: step-1-select-event'),
    ).toBeInTheDocument()
  })
})
