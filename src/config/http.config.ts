/** Backend de desarrollo documentado en Context.md 7.2. */
const DEFAULT_BASE_URL = 'http://localhost:3000'

/**
 * Configuración base de red (Context.md 7.2).
 * El entorno contra el que se comunica la app se resuelve desde variables de
 * entorno de Vite; una variable ausente o vacía cae al backend de desarrollo.
 */
export const HTTP_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const
