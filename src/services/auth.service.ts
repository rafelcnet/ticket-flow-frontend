import {
  LoginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from '../schemas/auth.schema'
import { httpClient } from '../http/http.client'
import { clearToken, saveToken } from '../http/token.storage'

/**
 * `POST /auth/login` (SpecHttp 7.2). Propaga `INVALID_CREDENTIALS` (401) tal
 * cual — es la excepción cerrada del interceptor de response (SpecHttp 4.2).
 * Único punto del proyecto que llama a `saveToken` (SpecAuth 2.3).
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/auth/login', credentials)
  const parsed = LoginResponseSchema.parse(response)
  saveToken(parsed.token)
  return parsed
}

/**
 * `POST /auth/logout` (SpecHttp 7.3).
 * Llama a `clearToken` explícitamente (SpecAuth 3.2); si el token ya era
 * inválido, el interceptor global de 401 lo limpia antes de que el error
 * llegue aquí (SpecAuth 3.3), así que no hace falta un `catch` adicional.
 */
export const logout = async (): Promise<void> => {
  await httpClient.post<void>('/auth/logout')
  clearToken()
}
