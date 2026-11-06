import { clsx } from 'clsx'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={clsx('table-container', className)}>
      <table className="table" role="grid">
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={clsx(className)}>{children}</thead>
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={clsx(className)}>{children}</tbody>
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx(className)} {...props}>{children}</tr>
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={clsx(className)} {...props}>{children}</th>
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx(className)} {...props}>{children}</td>
}