import { describe, expect, it } from 'vitest'
import { LoginRequestSchema } from './auth.schema'

describe('LoginRequestSchema', () => {
  it('acepta un email y password no vacíos', () => {
    // Given: credenciales completas (SpecHttp 7.2)
    const credenciales = {
      email: 'sofia.hernandez@ticketflow.com',
      password: 'ticket123',
    }

    // When: se valida el formulario
    const result = LoginRequestSchema.safeParse(credenciales)

    // Then: la validación pasa
    expect(result.success).toBe(true)
  })

  it('rechaza el envío si el email está vacío (SpecAuth 2.1: campos requeridos)', () => {
    // Given: un formulario sin email
    const credenciales = { email: '', password: 'ticket123' }

    // When: se valida el formulario
    const result = LoginRequestSchema.safeParse(credenciales)

    // Then: la validación falla con un mensaje para ese campo
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toContain(
      'El correo es obligatorio',
    )
  })

  it('rechaza el envío si el password está vacío', () => {
    // Given: un formulario sin password
    const credenciales = { email: 'sofia.hernandez@ticketflow.com', password: '' }

    // When: se valida el formulario
    const result = LoginRequestSchema.safeParse(credenciales)

    // Then: la validación falla con un mensaje para ese campo
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.password).toContain(
      'La contraseña es obligatoria',
    )
  })

  it('rechaza el envío si ambos campos están vacíos', () => {
    // Given: un formulario completamente vacío
    const credenciales = { email: '', password: '' }

    // When: se valida el formulario
    const result = LoginRequestSchema.safeParse(credenciales)

    // Then: se reportan los dos errores a la vez
    expect(result.success).toBe(false)
    const errores = result.error?.flatten().fieldErrors
    expect(errores?.email).toContain('El correo es obligatorio')
    expect(errores?.password).toContain('La contraseña es obligatoria')
  })
})
