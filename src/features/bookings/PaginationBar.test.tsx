import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaginationBar } from './PaginationBar'

describe('PaginationBar', () => {
  it('no renderiza nada si hay una sola página (nada que paginar)', () => {
    // Given / When: sólo hay una página de resultados
    const { container } = render(
      <PaginationBar page={1} totalPages={1} onPageChange={vi.fn()} />,
    )

    // Then: no se muestra ningún control
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza Previous, un botón por página y Next (Context.md 5.5)', () => {
    // Given / When: hay 3 páginas de resultados
    render(<PaginationBar page={2} totalPages={3} onPageChange={vi.fn()} />)

    // Then: se ven los controles esperados
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('marca la página actual con aria-current', () => {
    // Given / When: la página 2 de 3 está activa
    render(<PaginationBar page={2} totalPages={3} onPageChange={vi.fn()} />)

    // Then: sólo ese botón queda marcado
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current')
  })

  it('deshabilita Previous en la primera página', () => {
    // Given / When: el usuario está en la página 1
    render(<PaginationBar page={1} totalPages={3} onPageChange={vi.fn()} />)

    // Then: Previous está deshabilitado
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('deshabilita Next en la última página', () => {
    // Given / When: el usuario está en la última página
    render(<PaginationBar page={3} totalPages={3} onPageChange={vi.fn()} />)

    // Then: Next está deshabilitado
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('notifica el número de página al hacer click en un número', async () => {
    // Given: 3 páginas disponibles
    const usuario = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationBar page={1} totalPages={3} onPageChange={onPageChange} />)

    // When: el usuario hace click en la página 3
    await usuario.click(screen.getByRole('button', { name: '3' }))

    // Then: se notifica esa página
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('Next avanza a la página siguiente', async () => {
    // Given: el usuario está en la página 1 de 3
    const usuario = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationBar page={1} totalPages={3} onPageChange={onPageChange} />)

    // When: pulsa Next
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: se pide la página 2
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('Previous retrocede a la página anterior', async () => {
    // Given: el usuario está en la página 2 de 3
    const usuario = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationBar page={2} totalPages={3} onPageChange={onPageChange} />)

    // When: pulsa Previous
    await usuario.click(screen.getByRole('button', { name: 'Previous' }))

    // Then: se pide la página 1
    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})
