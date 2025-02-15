import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { PositionControls } from "./PositionControls";
import { RiskIndicator } from "./RiskIndicator";

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
  portfolioValue: number;
}

export function PositionTable({ positions, isLoading, onPositionClose, portfolioValue }: PositionTableProps) {
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);

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
            <TableHead>Risk</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <>
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
                  <RiskIndicator position={position} portfolioValue={portfolioValue} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedPosition(expandedPosition === position.id ? null : position.id)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleClosePosition(position.id)}
                    >
                      Close
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedPosition === position.id && (
                <TableRow>
                  <TableCell colSpan={11} className="p-0">
                    <PositionControls
                      positionId={position.id}
                      symbol={position.symbol}
                      currentPrice={position.current_price}
                      stopLoss={position.stop_loss || null}
                      takeProfit={position.take_profit || null}
                      onUpdate={() => setExpandedPosition(null)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
          {positions.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                No active positions
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 