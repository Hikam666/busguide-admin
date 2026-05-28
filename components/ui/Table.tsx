import React from 'react'
import styles from './Table.module.css'

interface Column<T> {
  key: string
  title: string
  render?: (item: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
}

export function Table<T extends { id: string | number }>({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = 'Tidak ada data.' 
}: TableProps<T>) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.title}</th>
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
              <tr key={item.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
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
