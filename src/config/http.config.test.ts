import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Carga el módulo de configuración desde cero para que vuelva a leer
 * `import.meta.env` con el valor simulado en cada caso.
 */
const cargarHttpConfig = async () => {
  vi.resetModules()
  const { HTTP_CONFIG } = await import('./http.config')
  return HTTP_CONFIG
}

describe('HTTP_CONFIG', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('usa la URL del backend definida en la variable de entorno', async () => {
    // Given: el entorno define una URL de backend distinta a la de desarrollo
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.ticketflow.test')

    // When: se carga la configuración HTTP
    const config = await cargarHttpConfig()

    // Then: la aplicación apunta al backend indicado por el entorno
    expect(config.baseURL).toBe('https://api.ticketflow.test')
  })

  it('cae a http://localhost:3000 cuando el entorno no define la URL del backend', async () => {
    // Given: el entorno no define ninguna URL de backend
    vi.stubEnv('VITE_API_BASE_URL', undefined)

    // When: se carga la configuración HTTP
    const config = await cargarHttpConfig()

    // Then: se usa el backend de desarrollo documentado en Context.md 7.2
    expect(config.baseURL).toBe('http://localhost:3000')
  })

  it('cae a http://localhost:3000 cuando la variable de entorno está vacía', async () => {
    // Given: el entorno define la variable pero sin valor
    vi.stubEnv('VITE_API_BASE_URL', '')

    // When: se carga la configuración HTTP
    const config = await cargarHttpConfig()

    // Then: una cadena vacía no se considera un destino válido
    expect(config.baseURL).toBe('http://localhost:3000')
  })

  it('expone el timeout y las cabeceras base fijados en Context.md 7.2', async () => {
    // Given: la configuración base de red del PRD

    // When: se carga la configuración HTTP
    const config = await cargarHttpConfig()

    // Then: el timeout es de 10000 ms y el contenido se negocia como JSON
    expect(config.timeout).toBe(10_000)
    expect(config.headers).toEqual({ 'Content-Type': 'application/json' })
  })
})
