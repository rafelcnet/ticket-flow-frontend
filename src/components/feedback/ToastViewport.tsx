import { useEffect, useState } from 'react'
import {
  subscribeToGlobalErrors,
  type GlobalErrorNotification,
} from '../../http/error-bus'
import styles from './ToastViewport.module.css'

/** Los toasts globales de 403/500 se retiran solos tras este tiempo (Context.md 7.1). */
const AUTO_DISMISS_MS = 6000

/**
 * Muestra los toasts genéricos de 403/500 disparados por el interceptor de
 * response (SpecHttp 4.2). Componente "tonto": sólo se suscribe al bus de
 * errores de `http/`, no conoce servicios ni slices (SpecProject 1).
 */
export const ToastViewport = () => {
  const [notifications, setNotifications] = useState<GlobalErrorNotification[]>([])

  const dismiss = (id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    )
  }

  useEffect(() => {
    const unsubscribe = subscribeToGlobalErrors((notification) => {
      setNotifications((current) => [...current, notification])
      setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS)
    })
    return unsubscribe
  }, [])

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={styles.toast}>
          <span className={styles.message}>{notification.message}</span>
          <button
            type="button"
            className={styles.dismiss}
            aria-label="Cerrar"
            onClick={() => dismiss(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
