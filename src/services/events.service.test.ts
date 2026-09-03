import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { getPaginatedEvents } from './events.service'

vi.mock('../http/http.client')

const eventoEjemplo = {
  id: 'evt-001',
  venueId: 'ven-001',
  name: 'Bad Liebre',
  date: '2025-02-15',
  time: '21:00',
  location: 'Ciudad de México, México',
  imageUrl: 'https://raw.githubusercontent.com/.../bad-liebre.png',
  basePrice: 150,
  currency: 'USD',
}

describe('events.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getPaginatedEvents', () => {
    it('pide GET /events/paginated con page y limit, y devuelve data + pagination (FIX-1)', async () => {
      // Given: el backend responde con una página del catálogo
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [eventoEjemplo],
        pagination: { page: 1, limit: 6, total: 20, totalPages: 4 },
      })

      // When: se pide la página 1 con 6 eventos por página
      const response = await getPaginatedEvents(1, 6)

      // Then: se llama al endpoint paginado con los query params correctos
      expect(httpClient.get).toHaveBeenCalledWith('/events/paginated', {
        query: { page: 1, limit: 6 },
      })
      expect(response.data).toHaveLength(1)
      expect(response.data[0].name).toBe('Bad Liebre')
      expect(response.pagination).toEqual({ page: 1, limit: 6, total: 20, totalPages: 4 })
    })

    it('pide la página y el límite indicados, no siempre los mismos por defecto', async () => {
      // Given: el backend responde con la tercera página
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [],
        pagination: { page: 3, limit: 6, total: 20, totalPages: 4 },
      })

      // When: se pide explícitamente la página 3
      await getPaginatedEvents(3, 6)

      // Then: la petición usa esa página, no un valor fijo
      expect(httpClient.get).toHaveBeenCalledWith('/events/paginated', {
        query: { page: 3, limit: 6 },
      })
    })

    it('devuelve una página vacía cuando no hay eventos publicados', async () => {
      // Given: el backend no tiene eventos cargados
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
      })

      // When: se pide la primera página
      const response = await getPaginatedEvents(1, 6)

      // Then: se obtiene un arreglo vacío, sin errores
      expect(response.data).toEqual([])
      expect(response.pagination.total).toBe(0)
    })

    it('propaga UNAUTHORIZED cuando no hay una sesión válida (401)', async () => {
      // Given: la petición llega sin token o con uno inválido — endpoint protegido, igual que GET /events
      const error = Object.assign(new Error('Invalid or missing token'), {
        code: 'UNAUTHORIZED',
        status: 401,
      })
      vi.mocked(httpClient.get).mockRejectedValue(error)

      // When: se piden los eventos disponibles
      const call = getPaginatedEvents(1, 6)

      // Then: el error llega tal cual a quien hizo la llamada
      await expect(call).rejects.toBe(error)
    })

    it('rechaza la respuesta si un evento no trae los campos exigidos por el contrato', async () => {
      // Given: un evento del backend sin `basePrice`
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [{ id: 'evt-001', venueId: 'ven-001', name: 'Bad Liebre' }],
        pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
      })

      // When: se procesa esa respuesta
      const call = getPaginatedEvents(1, 6)

      // Then: la validación de Zod detiene el flujo
      await expect(call).rejects.toThrow()
    })

    it('rechaza la respuesta si falta el objeto pagination', async () => {
      // Given: una respuesta sin la información de paginación exigida por el contrato
      vi.mocked(httpClient.get).mockResolvedValue({ data: [eventoEjemplo] })

      // When: se procesa esa respuesta
      const call = getPaginatedEvents(1, 6)

      // Then: la validación de Zod detiene el flujo
      await expect(call).rejects.toThrow()
    })

    it('no aplica ninguna caché — cada llamada golpea la red (FIX-1: sin caché, igual que /bookings)', async () => {
      // Given: dos páginas distintas del catálogo
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [eventoEjemplo],
        pagination: { page: 1, limit: 6, total: 20, totalPages: 4 },
      })

      // When: se pide la misma página dos veces seguidas
      await getPaginatedEvents(1, 6)
      await getPaginatedEvents(1, 6)

      // Then: ambas llamadas golpean la red, sin reutilizar una respuesta anterior
      expect(httpClient.get).toHaveBeenCalledTimes(2)
    })
  })
})
