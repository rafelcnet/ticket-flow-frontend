import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { getEvents } from './events.service'

vi.mock('../http/http.client')

describe('events.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getEvents', () => {
    it('devuelve el listado completo de eventos (200)', async () => {
      // Given: el backend responde con la lista de eventos (SpecHttp 7.5)
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [
          {
            id: 'evt-001',
            venueId: 'ven-001',
            name: 'Bad Liebre',
            date: '2025-02-15',
            time: '21:00',
            location: 'Ciudad de México, México',
            imageUrl: 'https://raw.githubusercontent.com/.../bad-liebre.png',
            basePrice: 150,
            currency: 'USD',
          },
        ],
      })

      // When: se piden los eventos disponibles
      const events = await getEvents()

      // Then: se llama a GET /events y se devuelve el arreglo ya desenvuelto
      expect(httpClient.get).toHaveBeenCalledWith('/events')
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Bad Liebre')
    })

    it('devuelve un arreglo vacío cuando no hay eventos publicados', async () => {
      // Given: el backend no tiene eventos cargados
      vi.mocked(httpClient.get).mockResolvedValue({ data: [] })

      // When: se piden los eventos disponibles
      const events = await getEvents()

      // Then: se obtiene un arreglo vacío, sin errores
      expect(events).toEqual([])
    })

    it('propaga UNAUTHORIZED cuando no hay una sesión válida (401)', async () => {
      // Given: la petición llega sin token o con uno inválido (SpecHttp 7.5)
      const error = Object.assign(new Error('Invalid or missing token'), {
        code: 'UNAUTHORIZED',
        status: 401,
      })
      vi.mocked(httpClient.get).mockRejectedValue(error)

      // When: se piden los eventos disponibles
      const call = getEvents()

      // Then: el error llega tal cual a quien hizo la llamada
      await expect(call).rejects.toBe(error)
    })

    it('rechaza la respuesta si un evento no trae los campos exigidos por el contrato', async () => {
      // Given: un evento del backend sin `basePrice`
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [{ id: 'evt-001', venueId: 'ven-001', name: 'Bad Liebre' }],
      })

      // When: se procesa esa respuesta
      const call = getEvents()

      // Then: la validación de Zod detiene el flujo
      await expect(call).rejects.toThrow()
    })
  })
})
