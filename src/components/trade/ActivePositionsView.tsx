import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PositionTable } from "./PositionTable";
import { supabase } from "@/integrations/supabase/client";
import { PriceService } from "@/services/price/price.service";
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
  created_at: string;
}

export function ActivePositionsView() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    const priceService = new PriceService();
    let priceUpdateInterval: NodeJS.Timeout;

    const fetchPositions = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .eq('status', 'OPEN')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error("Failed to load positions");
          console.error("Error fetching positions:", error);
          return;
        }

        // Update positions with current prices
        const updatedPositions = await Promise.all(data.map(async (position) => {
          try {
            const assets = await priceService.getAssets([position.type]);
            const asset = assets.find(a => a.symbol === position.symbol);
            if (asset) {
              const currentPrice = asset.price;
              const pnl = position.side === 'LONG' 
                ? (currentPrice - position.entry_price) * position.amount
                : (position.entry_price - currentPrice) * position.amount;

              return {
                ...position,
                current_price: currentPrice,
                profit_loss: pnl
              };
            }
            return position;
          } catch (error) {
            console.error(`Error updating price for ${position.symbol}:`, error);
            return position;
          }
        }));

        setPositions(updatedPositions);
        updateTotals(updatedPositions);
      } catch (error) {
        console.error("Error in fetchPositions:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    const updateTotals = (positions: Position[]) => {
      const value = positions.reduce((sum, pos) => sum + (pos.amount * pos.current_price), 0);
      const pnl = positions.reduce((sum, pos) => sum + (pos.profit_loss || 0), 0);
      setTotalValue(value);
      setTotalPnL(pnl);
    };

    // Initial fetch
    fetchPositions();

    // Set up real-time updates
    const channel = supabase
      .channel('positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: 'status=eq.OPEN'
        },
        () => fetchPositions()
      )
      .subscribe();

    // Update prices every 30 seconds
    priceUpdateInterval = setInterval(fetchPositions, 30000);

    return () => {
      clearInterval(priceUpdateInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPrice(totalPnL)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <PositionTable 
            positions={positions}
            isLoading={isLoading}
            portfolioValue={totalValue}
            onPositionClose={(id) => {
              setPositions(prev => prev.filter(p => p.id !== id));
              toast.success("Position closed successfully");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 