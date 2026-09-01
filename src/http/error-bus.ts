/**
 * Canal de notificación de errores globales (403/500, Context.md 7.1).
 * `http/` no conoce React (SpecProject 1) — expone un pub/sub plano en vez de
 * disparar UI directamente. `components/feedback` se suscribe para mostrar
 * el toast correspondiente.
 */
export interface GlobalErrorNotification {
  id: string
  message: string
}

type Listener = (notification: GlobalErrorNotification) => void

const listeners = new Set<Listener>()

export const notifyGlobalError = (message: string): void => {
  const notification: GlobalErrorNotification = {
    id: crypto.randomUUID(),
    message,
  }
  for (const listener of listeners) {
    listener(notification)
  }
}

export const subscribeToGlobalErrors = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
