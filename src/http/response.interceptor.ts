import { notifyGlobalError } from './error-bus'
import { clearToken } from './token.storage'
import { ApiError, type ApiErrorBody, type HttpMethod } from './http.types'

/** Único endpoint excluido de la regla global de 401 (SpecHttp 4.2). */
const LOGIN_PATH = '/auth/login'
/** Fuera del árbol de rutas de React Router — recarga completa tras limpiar la sesión. */
const LOGIN_ROUTE = '/login'

const FORBIDDEN_MESSAGE = 'No tienes permiso para realizar esta acción'
const SERVER_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.'

interface RequestContext {
  method: HttpMethod
  path: string
}

const isLoginRequest = ({ method, path }: RequestContext) =>
  method === 'POST' && path === LOGIN_PATH

/**
 * Interceptor de response (SpecHttp 4.2, Context.md 7.1).
 * Se ejecuta tras cada respuesta del backend: decide si la petición fue
 * exitosa, y si no lo fue, aplica el manejo global de 401/403/500 antes de
 * propagar el error al llamador.
 */
export const applyResponseInterceptor = async <T>(
  response: Response,
  context: RequestContext,
): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  const body = (await response.json()) as ApiErrorBody

  if (response.status === 401 && !isLoginRequest(context)) {
    clearToken()
    window.location.assign(LOGIN_ROUTE)
  } else if (response.status === 403) {
    notifyGlobalError(FORBIDDEN_MESSAGE)
  } else if (response.status === 500) {
    notifyGlobalError(SERVER_ERROR_MESSAGE)
  }

  throw new ApiError(response.status, body)
}
