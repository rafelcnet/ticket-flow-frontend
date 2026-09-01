import { ToastViewport } from './components/feedback/ToastViewport'
import { AppRouter } from './routes/AppRouter'

/**
 * Composición raíz: router + providers globales.
 * `ToastViewport` muestra los toasts de 403/500 disparados por el
 * interceptor de response (SpecHttp 4.2) desde cualquier pantalla.
 * Los providers de las 4 slices de estado (8.4) se montan aquí cuando
 * lleguen sus tickets correspondientes.
 */
const App = () => (
  <>
    <AppRouter />
    <ToastViewport />
  </>
)

export default App
