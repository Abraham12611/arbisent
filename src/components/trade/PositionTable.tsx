import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Position {
  id: string;
  symbol: string;
  type: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  current_price: number;
  amount: number;
  profit_loss: number;
  stop_loss?: number;
  take_profit?: number;
}

interface PositionTableProps {
  positions: Position[];
  isLoading: boolean;
  onPositionClose: (id: string) => void;
}

export function PositionTable({ positions, isLoading, onPositionClose }: PositionTableProps) {
  const handleClosePosition = async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('positions')
        .update({ 
          status: 'CLOSED',
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (error) throw error;
      onPositionClose(positionId);
    } catch (error) {
      console.error("Error closing position:", error);
      toast.error("Failed to close position");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>P/L</TableHead>
            <TableHead>Stop Loss</TableHead>
            <TableHead>Take Profit</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-medium">{position.symbol}</TableCell>
              <TableCell>{position.type}</TableCell>
              <TableCell>
                <span className={position.side === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                  {position.side}
                </span>
              </TableCell>
              <TableCell>{formatPrice(position.entry_price)}</TableCell>
              <TableCell>{formatPrice(position.current_price)}</TableCell>
              <TableCell>{position.amount}</TableCell>
              <TableCell className={position.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPrice(position.profit_loss)}
              </TableCell>
              <TableCell>
                {position.stop_loss ? formatPrice(position.stop_loss) : '-'}
              </TableCell>
              <TableCell>
                {position.take_profit ? formatPrice(position.take_profit) : '-'}
              </TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleClosePosition(position.id)}
                >
                  Close
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                No active positions
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 