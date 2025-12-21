import * as React from "react"
import { cn } from "@/lib/utils"

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  )
}

export function Th({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("h-10 px-3 text-left font-medium text-muted-foreground border-b bg-muted/30", className)} {...props}>
      {children}
    </th>
  )
}

export function Td({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 border-b align-top", className)} {...props}>{children}</td>
}

export function Tr({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-muted/20 transition-colors", className)} {...props}>{children}</tr>
}

// Aliases for compatibility
export const DataTableHeader = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...props}>{children}</thead>
)

export const DataTableBody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props}>{children}</tbody>
)

export const DataTableRow = Tr
export const DataTableHead = Th
export const DataTableCell = Td
