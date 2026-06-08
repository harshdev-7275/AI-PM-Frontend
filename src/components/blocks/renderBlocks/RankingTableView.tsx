import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { RankingTableBlock } from '@/types/renderBlocks'

interface RankingTableViewProps {
  block: RankingTableBlock
}

// Usage: render a ranking/comparison table (ranking_table block). The
// highlighted row (e.g. the "winner") is bolded.
//   <RankingTableView block={block} />
export function RankingTableView({ block }: RankingTableViewProps) {
  return (
    <div className="my-2">
      {block.title && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {block.title}
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {block.columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.align === 'right' ? 'text-right' : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.map((row, ri) => (
            <TableRow key={ri} className={cn(row.highlight && 'font-semibold text-foreground')}>
              {row.cells.map((cell, ci) => (
                <TableCell
                  key={ci}
                  className={block.columns[ci]?.align === 'right' ? 'text-right' : undefined}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
