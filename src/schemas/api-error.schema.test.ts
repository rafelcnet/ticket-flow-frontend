import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './api-error.schema'

describe('ApiErrorSchema', () => {
  it('valida la forma común de error de todo el proyecto (SpecHttp 5)', () => {
    // Given: un error de negocio tal como lo documenta el Postman collection
    const body = {
      error: 'SEAT_UNAVAILABLE',
      message: 'The selected seat is not available',
    }

    // When: se valida el cuerpo del error
    const result = ApiErrorSchema.parse(body)

    // Then: se acepta tal cual, sin campos adicionales requeridos
    expect(result).toEqual(body)
  })

  it('rechaza un cuerpo de error sin el campo message', () => {
    // Given: un cuerpo de error incompleto
    const body = { error: 'VALIDATION_ERROR' }

    // When / Then: la validación falla porque `message` es obligatorio
    expect(() => ApiErrorSchema.parse(body)).toThrow()
  })
})
