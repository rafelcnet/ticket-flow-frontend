/** Verbos usados por el catálogo de endpoints (SpecHttp 7). */
export type HttpMethod = 'GET' | 'POST' | 'PATCH'

/** Forma común de error del backend (SpecHttp 5, `schemas/api-error`). */
export interface ApiErrorBody {
  error: string
  message: string
}

export interface RequestOptions {
  /** Query params serializados como `?clave=valor` (SpecHttp 7.9). */
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

/**
 * Error de negocio o de infraestructura propagado tal cual desde el backend
 * (SpecHttp 4.2, 5) — conserva `code` (`error`) y `status` para que el
 * service/feature que hizo la llamada decida cómo interpretarlo.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error
  }
}
