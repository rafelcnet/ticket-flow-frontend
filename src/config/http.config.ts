/**
 * Configuración base de red (Context.md 7.2).
 * El entorno contra el que se comunica la app se resuelve desde variables de
 * entorno de Vite, con el valor de desarrollo de 7.2 como fallback.
 */
export const HTTP_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const
