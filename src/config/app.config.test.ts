import { describe, expect, it } from 'vitest'
import { APP_CONFIG } from './app.config'

describe('APP_CONFIG', () => {
  it('expone el cargo por servicio de $8.00 del resumen de compra', () => {
    // Given: el cargo por servicio fijado en Context.md 5.4

    // When: se lee la configuración de la aplicación

    // Then: el valor coincide con el del PRD
    expect(APP_CONFIG.serviceFee).toBe(8.0)
  })

  it('expone un tamaño de página por defecto de 10 reservas', () => {
    // Given: la paginación de My Bookings descrita en Context.md 5.5

    // When: se lee la configuración de la aplicación

    // Then: el listado pide 10 elementos por página
    expect(APP_CONFIG.defaultPageSize).toBe(10)
  })
})
