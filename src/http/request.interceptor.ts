import { getToken } from './token.storage'

/**
 * Interceptor de request (SpecHttp 4.1, Context.md 8.3).
 * Adjunta `Authorization: Bearer <token>` si hay sesión; no distingue entre
 * endpoints públicos y protegidos — esa decisión no le corresponde a `http/`.
 */
export const applyRequestInterceptor = (headers: Headers): Headers => {
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}
