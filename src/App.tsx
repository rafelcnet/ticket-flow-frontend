import { AppRouter } from './routes/AppRouter'

/**
 * Composición raíz: router + providers globales.
 * Los providers de las 4 slices de estado (8.4) se montan aquí cuando
 * lleguen sus tickets correspondientes.
 */
const App = () => <AppRouter />

export default App
