import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as requestInterceptor from './request.interceptor'
import * as responseInterceptor from './response.interceptor'
import { httpClient } from './http.client'

vi.mock('./request.interceptor')
vi.mock('./response.interceptor')

describe('httpClient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requestInterceptor.applyRequestInterceptor).mockImplementation(
      (headers) => headers,
    )
    vi.mocked(responseInterceptor.applyResponseInterceptor).mockResolvedValue({
      ok: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('get', () => {
    it('hace un GET contra baseURL + path, sin body', async () => {
      // Given: un recurso protegido del catálogo (SpecHttp 7.5)
      // When: se pide el listado de eventos
      await httpClient.get('/events')

      // Then: la petición sale con el verbo y la URL correctos, sin cuerpo
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/events',
        expect.objectContaining({ method: 'GET', body: undefined }),
      )
    })

    it('serializa los query params definidos y omite los que son undefined', async () => {
      // Given: un listado de reservas con filtros parciales (SpecHttp 7.9)
      // When: se listan reservas filtrando sólo por status
      await httpClient.get('/bookings', {
        query: { status: 'confirmed', eventName: undefined, page: 1 },
      })

      // Then: la URL sólo incluye los parámetros con valor
      const [url] = vi.mocked(fetch).mock.calls[0] as [string]
      expect(url).toBe('http://localhost:3000/bookings?status=confirmed&page=1')
    })

    it('delega en el interceptor de request para resolver los headers', async () => {
      // Given: el interceptor de request adjuntaría Authorization si hay sesión
      // When: se hace cualquier GET
      await httpClient.get('/users/me')

      // Then: el interceptor de request participó en la construcción de la petición
      expect(requestInterceptor.applyRequestInterceptor).toHaveBeenCalledOnce()
    })

    it('propaga el resultado del interceptor de response como valor de retorno', async () => {
      // Given: el interceptor de response ya validó y transformó la respuesta
      vi.mocked(responseInterceptor.applyResponseInterceptor).mockResolvedValue({
        data: [],
      })

      // When: se hace la petición
      const result = await httpClient.get('/events')

      // Then: el cliente devuelve exactamente lo que resolvió el interceptor
      expect(result).toEqual({ data: [] })
    })

    it('propaga el rechazo del interceptor de response cuando la petición falla', async () => {
      // Given: el backend responde con un error de negocio
      const error = new Error('EVENT_NOT_FOUND')
      vi.mocked(responseInterceptor.applyResponseInterceptor).mockRejectedValue(error)

      // When: se pide el mapa de asientos de un evento inexistente
      const call = httpClient.get('/events/evt-999/seats')

      // Then: el error llega tal cual a quien hizo la llamada
      await expect(call).rejects.toBe(error)
    })
  })

  describe('post', () => {
    it('hace un POST con el body serializado como JSON', async () => {
      // Given: un intento de login (SpecHttp 7.2)
      const credentials = {
        email: 'sofia.hernandez@ticketflow.com',
        password: 'ticket123',
      }

      // When: se llama a POST /auth/login
      await httpClient.post('/auth/login', credentials)

      // Then: el body va serializado en JSON
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/login',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(credentials) }),
      )
    })

    it('hace un POST sin body cuando no se provee ninguno', async () => {
      // Given: un logout, que no requiere body (SpecHttp 7.3)
      // When: se llama a POST /auth/logout sin payload
      await httpClient.post('/auth/logout')

      // Then: la petición sale sin cuerpo
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/logout',
        expect.objectContaining({ method: 'POST', body: undefined }),
      )
    })
  })

  describe('patch', () => {
    it('hace un PATCH contra la ruta indicada', async () => {
      // Given: la cancelación de una reserva (SpecHttp 7.10)
      // When: se cancela la reserva TF-001
      await httpClient.patch('/bookings/TF-001/cancel')

      // Then: se usa el verbo PATCH sobre la ruta con el id de la reserva
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/bookings/TF-001/cancel',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
  })

  describe('timeout', () => {
    it('aborta la petición si el backend no responde dentro del timeout configurado (10000ms)', async () => {
      // Given: un backend que nunca responde
      vi.useFakeTimers()
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort')
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

      // When: se hace una petición y transcurre el timeout de Context.md 7.2
      void httpClient.get('/events')
      await vi.advanceTimersByTimeAsync(10_000)

      // Then: el controlador de aborto se dispara para no dejar la petición colgada
      expect(abortSpy).toHaveBeenCalledOnce()
    })
  })
})
