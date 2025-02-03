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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PositionTableProps {
  positions: Trade[];
  isLoading: boolean;
}

export function PositionTable({ positions, isLoading }: PositionTableProps) {
  const handleClosePosition = async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'Closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (error) throw error;
      toast.success("Position closed successfully");
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
            <TableHead>Pair</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Current P/L</TableHead>
            <TableHead>Stop Loss</TableHead>
            <TableHead>Take Profit</TableHead>
            <TableHead>Actions</TableHead>
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
              <TableCell colSpan={9} className="text-center">
                No active positions
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}