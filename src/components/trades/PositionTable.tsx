import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trade } from "@/types/trade";
import { StopLossForm } from "./StopLossForm";
import { TakeProfitForm } from "./TakeProfitForm";

interface PositionTableProps {
  positions: Trade[];
}

export function PositionTable({ positions }: PositionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Current P/L</TableHead>
            <TableHead>Stop Loss</TableHead>
            <TableHead>Take Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell>{position.pair_name}</TableCell>
              <TableCell>{position.type}</TableCell>
              <TableCell>{position.side}</TableCell>
              <TableCell>${position.entry_price.toFixed(2)}</TableCell>
              <TableCell>{position.amount}</TableCell>
              <TableCell className={position.profit_loss && position.profit_loss >= 0 ? "text-green-500" : "text-red-500"}>
                ${position.profit_loss?.toFixed(2) || "0.00"}
              </TableCell>
              <TableCell>
                <StopLossForm position={position} />
              </TableCell>
              <TableCell>
                <TakeProfitForm position={position} />
              </TableCell>
            </TableRow>
          ))}
          {positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No active positions
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}