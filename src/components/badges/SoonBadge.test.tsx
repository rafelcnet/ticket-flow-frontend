import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SoonBadge } from './SoonBadge'

describe('SoonBadge', () => {
  it('muestra el texto "Soon" que marca una funcionalidad futura (Context.md 9)', () => {
    // Given / When: se renderiza el badge
    render(<SoonBadge />)

    // Then: el texto es visible
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })
})
