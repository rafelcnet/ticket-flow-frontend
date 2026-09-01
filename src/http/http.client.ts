import { HTTP_CONFIG } from '../config/http.config'
import { applyRequestInterceptor } from './request.interceptor'
import { applyResponseInterceptor } from './response.interceptor'
import type { HttpMethod, RequestOptions } from './http.types'

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const url = new URL(path, HTTP_CONFIG.baseURL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

const request = async <T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> => {
  const headers = applyRequestInterceptor(new Headers(HTTP_CONFIG.headers))
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), HTTP_CONFIG.timeout)

  try {
    const response = await fetch(buildUrl(path, options?.query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal ?? controller.signal,
    })
    return await applyResponseInterceptor<T>(response, { method, path })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * `HttpClient` — módulo propio sobre `fetch` nativo (SpecProject 0, SpecHttp 1).
 * Única puerta de entrada al backend: aplica la configuración base (7.2) y
 * los interceptores de request/response (4.1, 4.2) a cada llamada.
 */
export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
}
