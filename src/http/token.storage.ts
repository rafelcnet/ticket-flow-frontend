/**
 * Token Storage — interfaz de referencia de Context.md 8.2, sin cambios de
 * nombre ni de forma (SpecHttp 3). Único punto autorizado para leer, escribir
 * o borrar el token de sesión — ningún otro módulo accede a `localStorage`
 * directamente (SpecHttp 3, Context.md 10).
 */
const TOKEN_STORAGE_KEY = 'ticketflow_token'

export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY)

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const hasToken = (): boolean => getToken() !== null
