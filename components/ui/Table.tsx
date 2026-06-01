import React from 'react'
import styles from './Table.module.css'

interface Column<T> {
  key: string
  title: string
  width?: string
  render?: (item: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  selectedRowId?: string | number
}

export function Table<T extends { id: string | number }>({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = 'Tidak ada data.',
  onRowClick,
  selectedRowId
}: TableProps<T>) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className={styles.centerCell}>
                <div className={styles.spinner}></div>
                <span style={{ marginLeft: '0.5rem' }}>Memuat data...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.centerCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.id}
                onClick={() => onRowClick?.(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                className={selectedRowId === item.id ? styles.selectedRow : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
