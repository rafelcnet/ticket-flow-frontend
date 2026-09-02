import { ToastViewport } from './components/feedback/ToastViewport'
import { AppRouter } from './routes/AppRouter'
import { AuthProvider } from './state/auth/auth.context'

/**
 * Composición raíz: router + providers globales.
 * `ToastViewport` muestra los toasts de 403/500 disparados por el
 * interceptor de response (SpecHttp 4.2) desde cualquier pantalla.
 * `AuthProvider` monta la slice `auth` (Context.md 8.4); las otras 3 slices
 * se montan aquí cuando lleguen sus tickets correspondientes.
 */
const App = () => (
  <AuthProvider>
    <AppRouter />
    <ToastViewport />
  </AuthProvider>
)

export default App
