import { describe, expect, it } from 'vitest'
import {
  parseFiltersFromSearchParams,
  parseLimitFromSearchParams,
  parsePageFromSearchParams,
} from './bookings-query.utils'

describe('parseFiltersFromSearchParams', () => {
  it('lee los cuatro filtros desde los query params de la URL (SpecBookings 1)', () => {
    // Given: una URL con los cuatro filtros aplicados
    const searchParams = new URLSearchParams(
      'eventName=Bad+Liebre&status=confirmed&dateFrom=2025-01-01&dateTo=2025-12-31',
    )

    // When: se parsean los filtros
    const filtros = parseFiltersFromSearchParams(searchParams)

    // Then: cada filtro queda resuelto tal como venía en la URL
    expect(filtros).toEqual({
      eventName: 'Bad Liebre',
      status: 'confirmed',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
    })
  })

  it('devuelve undefined para cada filtro ausente en la URL', () => {
    // Given: una URL sin ningún filtro
    const searchParams = new URLSearchParams('')

    // When: se parsean los filtros
    const filtros = parseFiltersFromSearchParams(searchParams)

    // Then: los cuatro quedan undefined
    expect(filtros).toEqual({
      eventName: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  })

  it('ignora un status que no es uno de los tres valores válidos', () => {
    // Given: una URL con un status inventado (no confirmed/pending/cancelled)
    const searchParams = new URLSearchParams('status=archived')

    // When: se parsean los filtros
    const filtros = parseFiltersFromSearchParams(searchParams)

    // Then: el status inválido no se propaga como filtro
    expect(filtros.status).toBeUndefined()
  })
})

describe('parsePageFromSearchParams', () => {
  it('lee la página desde la URL', () => {
    // Given / When: una URL con page=3
    const resultado = parsePageFromSearchParams(new URLSearchParams('page=3'))

    // Then: se usa esa página
    expect(resultado).toBe(3)
  })

  it('usa la página 1 por defecto si no hay page en la URL (SpecBookings 1)', () => {
    // Given / When: una URL sin page
    const resultado = parsePageFromSearchParams(new URLSearchParams(''))

    // Then: por defecto es la página 1
    expect(resultado).toBe(1)
  })

  it('usa la página 1 por defecto ante un valor inválido (ej. negativo o no numérico)', () => {
    // Given / When: una URL con un page corrupto
    const resultado = parsePageFromSearchParams(new URLSearchParams('page=-1'))

    // Then: no se propaga un valor inválido
    expect(resultado).toBe(1)
  })
})

describe('parseLimitFromSearchParams', () => {
  it('lee el límite desde la URL', () => {
    // Given / When: una URL con limit=25
    const resultado = parseLimitFromSearchParams(new URLSearchParams('limit=25'))

    // Then: se usa ese límite
    expect(resultado).toBe(25)
  })

  it('usa 10 por defecto si no hay limit en la URL (SpecBookings 1: "Default: 10")', () => {
    // Given / When: una URL sin limit
    const resultado = parseLimitFromSearchParams(new URLSearchParams(''))

    // Then: por defecto es 10
    expect(resultado).toBe(10)
  })

  it('usa 10 por defecto ante un valor inválido', () => {
    // Given / When: una URL con un limit corrupto
    const resultado = parseLimitFromSearchParams(new URLSearchParams('limit=abc'))

    // Then: no se propaga un valor inválido
    expect(resultado).toBe(10)
  })
})
