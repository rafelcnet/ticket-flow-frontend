import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ZoneLegend } from './ZoneLegend'

const zonas = [
  { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 },
  { id: 'zon-002', name: 'Premium', color: '#f0a500', price: 110 },
  { id: 'zon-003', name: 'General', color: '#4caf50', price: 75 },
]

describe('ZoneLegend', () => {
  it('muestra nombre y precio de cada zona (Context.md 5.4: leyenda debajo del mapa)', () => {
    // Given / When: se renderiza la leyenda con las tres zonas
    render(<ZoneLegend zones={zonas} />)

    // Then: cada zona aparece con su nombre y precio
    expect(screen.getByText('VIP — $150.00')).toBeInTheDocument()
    expect(screen.getByText('Premium — $110.00')).toBeInTheDocument()
    expect(screen.getByText('General — $75.00')).toBeInTheDocument()
  })

  it('pinta el punto de color de cada zona con su color exacto (VIP/Premium/General)', () => {
    // Given / When: se renderiza la leyenda
    const { container } = render(<ZoneLegend zones={zonas} />)

    // Then: hay un punto de color por cada zona, con el color recibido del backend
    const puntos = container.querySelectorAll('li > span')
    expect(puntos).toHaveLength(3)
    expect(puntos[0]).toHaveStyle({ backgroundColor: zonas[0].color })
    expect(puntos[1]).toHaveStyle({ backgroundColor: zonas[1].color })
    expect(puntos[2]).toHaveStyle({ backgroundColor: zonas[2].color })
  })

  it('no renderiza ninguna entrada si no hay zonas', () => {
    // Given / When: la leyenda sin zonas
    const { container } = render(<ZoneLegend zones={[]} />)

    // Then: la lista queda vacía
    expect(container.querySelectorAll('li')).toHaveLength(0)
  })
})
