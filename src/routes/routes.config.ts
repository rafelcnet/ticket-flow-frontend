/**
 * Rutas de la aplicación — tabla de rutas de Context.md 8.5 / mapa de pantallas 5.1.
 * Única fuente de verdad para los paths; ninguna feature escribe un path literal.
 */
export const ROUTES = {
  login: '/login',
  home: '/home',
  buy: '/buy',
  bookings: '/bookings',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
