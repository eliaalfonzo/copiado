import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
}

/**
 * Tabla responsive: en pantallas anchas se ve como tabla tradicional;
 * en moviles se transforma en tarjetas apiladas (una por fila) usando
 * CSS, sin duplicar el marcado.
 */
export function DataTable<T>({ columns, data, getRowKey, emptyMessage }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
        {emptyMessage ?? 'No hay datos para mostrar.'}
      </p>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.hideOnMobile ? 'hide-mobile' : ''}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.header} className={col.hideOnMobile ? 'hide-mobile' : ''}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .data-table-wrapper { width: 100%; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table th {
          text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.03em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
        }
        .data-table td {
          padding: 12px; border-bottom: 1px solid var(--color-border); color: var(--color-text);
        }
        .data-table tr:last-child td { border-bottom: none; }
        @media (max-width: 720px) {
          .data-table thead { display: none; }
          .data-table, .data-table tbody, .data-table tr, .data-table td { display: block; width: 100%; }
          .data-table tr {
            margin-bottom: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
            padding: 8px 4px; background: var(--color-surface-alt);
          }
          .data-table td {
            display: flex; justify-content: space-between; gap: 12px; border-bottom: none; padding: 6px 12px;
          }
          .data-table td::before {
            content: attr(data-label); font-weight: 600; color: var(--color-text-secondary); font-size: 12px;
          }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
