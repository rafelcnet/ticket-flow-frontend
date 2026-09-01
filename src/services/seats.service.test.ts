import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { getSeatMap } from './seats.service'

vi.mock('../http/http.client')

describe('seats.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getSeatMap', () => {
    it('devuelve el mapa de asientos del evento pedido (200)', async () => {
      // Given: el backend responde con zonas y asientos (SpecHttp 7.6)
      vi.mocked(httpClient.get).mockResolvedValue({
        eventId: 'evt-001',
        venueType: 'arena',
        zones: [{ id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 }],
        seats: [
          { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'occupied' },
        ],
      })

      // When: se pide el mapa de asientos del evento evt-001
      const seatMap = await getSeatMap('evt-001')

      // Then: se llama a GET /events/:id/seats con el id correcto
      expect(httpClient.get).toHaveBeenCalledWith('/events/evt-001/seats')
      expect(seatMap.venueType).toBe('arena')
      expect(seatMap.seats[0].zone).toBe('zon-001')
    })

    it('propaga EVENT_NOT_FOUND cuando el evento no existe (404)', async () => {
      // Given: el evento pedido no existe (SpecHttp 7.6)
      const error = Object.assign(new Error('Event not found'), {
        code: 'EVENT_NOT_FOUND',
        status: 404,
      })
      vi.mocked(httpClient.get).mockRejectedValue(error)

      // When: se pide el mapa de asientos de un evento inexistente
      const call = getSeatMap('evt-999')

      // Then: el error llega tal cual a la feature de compra
      await expect(call).rejects.toBe(error)
    })

    it('rechaza la respuesta si el venueType no es uno de los tres soportados', async () => {
      // Given: un venueType fuera del enum de SpecHttp 7.6
      vi.mocked(httpClient.get).mockResolvedValue({
        eventId: 'evt-001',
        venueType: 'stadium',
        zones: [],
        seats: [],
      })

      // When: se procesa esa respuesta
      const call = getSeatMap('evt-001')

      // Then: la validación de Zod detiene el flujo
      await expect(call).rejects.toThrow()
    })
  })
})
