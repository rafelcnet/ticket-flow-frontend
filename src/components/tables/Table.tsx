import type { ReactNode } from 'react'
import styles from './Table.module.css'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
}

/**
 * Tabla genérica reutilizable (SpecProject 2: `components/tables`) — UI
 * compartida y "tonta": recibe columnas y filas ya resueltas, no conoce
 * slices ni hace fetch (SpecProject 1).
 */
export const Table = <T,>({ columns, rows, getRowKey }: TableProps<T>) => (
  <table className={styles.table}>
    <thead>
      <tr>
        {columns.map((column) => (
          <th key={column.key} scope="col">
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={getRowKey(row)}>
          {columns.map((column) => (
            <td key={column.key}>{column.render(row)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
