import { describe, expect, it } from 'vitest'
import { ROUTES } from './routes.config'

describe('ROUTES', () => {
  it('define exactamente las cuatro rutas de la tabla de Context.md 8.5', () => {
    // Given: la tabla de rutas del PRD

    // When: se leen las rutas declaradas

    // Then: no sobra ni falta ninguna ruta
    expect(ROUTES).toEqual({
      login: '/login',
      home: '/home',
      buy: '/buy',
      bookings: '/bookings',
    })
  })

  it('declara todas las rutas como paths absolutos', () => {
    // Given: las rutas declaradas por la aplicación

    // When: se revisa el formato de cada path
    const paths = Object.values(ROUTES)

    // Then: todas empiezan por barra, para que sean navegables desde cualquier pantalla
    expect(paths.every((path) => path.startsWith('/'))).toBe(true)
  })
})
