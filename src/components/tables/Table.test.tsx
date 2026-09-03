import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table, type TableColumn } from './Table'

interface Fila {
  id: string
  nombre: string
}

const filas: Fila[] = [
  { id: '1', nombre: 'Sofía' },
  { id: '2', nombre: 'Mateo' },
]

const columnas: TableColumn<Fila>[] = [
  { key: 'id', header: '#', render: (fila) => fila.id },
  { key: 'nombre', header: 'Nombre', render: (fila) => fila.nombre },
]

describe('Table', () => {
  it('renderiza un encabezado por columna', () => {
    // Given / When: se renderiza la tabla con dos columnas
    render(<Table columns={columnas} rows={filas} getRowKey={(fila) => fila.id} />)

    // Then: aparecen los encabezados en el orden dado
    expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument()
  })

  it('renderiza una fila por cada row, con el contenido resuelto por cada columna', () => {
    // Given / When: se renderiza la tabla con dos filas
    render(<Table columns={columnas} rows={filas} getRowKey={(fila) => fila.id} />)

    // Then: cada celda se resuelve con la función render de su columna
    expect(screen.getAllByRole('row')).toHaveLength(3) // encabezado + 2 filas
    expect(screen.getByText('Sofía')).toBeInTheDocument()
    expect(screen.getByText('Mateo')).toBeInTheDocument()
  })

  it('no renderiza ninguna fila si rows está vacío', () => {
    // Given / When: la tabla sin filas
    render(<Table columns={columnas} rows={[]} getRowKey={(fila) => fila.id} />)

    // Then: sólo queda la fila de encabezado
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })
})
