import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { clearEventsCache, getEvents } from './events.service'

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
    // La caché es un valor de módulo (SpecPurchase 6) — se limpia entre
    // tests para que no se filtre de un caso a otro.
    clearEventsCache()
  })

  describe('getEvents', () => {
    it('devuelve el listado completo de eventos (200)', async () => {
      // Given: el backend responde con la lista de eventos (SpecHttp 7.5)
      vi.mocked(httpClient.get).mockResolvedValue({ data: [eventoEjemplo] })

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

    it('no repite la llamada de red en una segunda petición dentro de la misma sesión (SpecPurchase 6)', async () => {
      // Given: ya se pidió el catálogo una vez
      vi.mocked(httpClient.get).mockResolvedValue({ data: [eventoEjemplo] })
      await getEvents()

      // When: se vuelve a pedir el catálogo
      const events = await getEvents()

      // Then: la segunda llamada devuelve la caché, sin golpear la red de nuevo
      expect(httpClient.get).toHaveBeenCalledOnce()
      expect(events).toHaveLength(1)
    })

    it('no reutiliza una respuesta fallida como si fuera caché', async () => {
      // Given: la primera petición falla
      vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('network error'))
      await expect(getEvents()).rejects.toThrow('network error')

      // When: se reintenta
      vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [eventoEjemplo] })
      const events = await getEvents()

      // Then: el reintento sí llega a la red y obtiene el catálogo
      expect(httpClient.get).toHaveBeenCalledTimes(2)
      expect(events).toHaveLength(1)
    })
  })

  describe('clearEventsCache', () => {
    it('fuerza una nueva llamada de red tras invalidar la caché (LOGOUT/SESSION_EXPIRED, SpecPurchase 6)', async () => {
      // Given: el catálogo ya está en caché
      vi.mocked(httpClient.get).mockResolvedValue({ data: [eventoEjemplo] })
      await getEvents()

      // When: se invalida la caché y se vuelve a pedir el catálogo
      clearEventsCache()
      await getEvents()

      // Then: la segunda petición sí golpea la red
      expect(httpClient.get).toHaveBeenCalledTimes(2)
    })

    it('no falla si se llama sin que exista ninguna caché previa', () => {
      // Given: nunca se pidió el catálogo
      // When / Then: limpiar la caché no lanza ningún error
      expect(() => clearEventsCache()).not.toThrow()
    })
  })
})
