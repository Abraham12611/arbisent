import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface PositionControlsProps {
  positionId: string;
  symbol: string;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  onUpdate: () => void;
}

export function PositionControls({
  positionId,
  symbol,
  currentPrice,
  stopLoss,
  takeProfit,
  onUpdate
}: PositionControlsProps) {
  const [newStopLoss, setNewStopLoss] = useState<string>(stopLoss?.toString() || "");
  const [newTakeProfit, setNewTakeProfit] = useState<string>(takeProfit?.toString() || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const updates: any = {};
      
      if (newStopLoss) {
        const stopLossValue = parseFloat(newStopLoss);
        if (isNaN(stopLossValue)) {
          toast.error("Invalid stop loss value");
          return;
        }
        updates.stop_loss = stopLossValue;
      }

      if (newTakeProfit) {
        const takeProfitValue = parseFloat(newTakeProfit);
        if (isNaN(takeProfitValue)) {
          toast.error("Invalid take profit value");
          return;
        }
        updates.take_profit = takeProfitValue;
      }

      const { error } = await supabase
        .from('positions')
        .update(updates)
        .eq('id', positionId);

      if (error) throw error;
      
      toast.success("Position controls updated");
      onUpdate();
    } catch (error) {
      console.error("Error updating position controls:", error);
      toast.error("Failed to update position controls");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStopLoss = (percentage: number) => {
    const newValue = currentPrice * (1 - percentage / 100);
    setNewStopLoss(newValue.toFixed(2));
  };

  const handleQuickTakeProfit = (percentage: number) => {
    const newValue = currentPrice * (1 + percentage / 100);
    setNewTakeProfit(newValue.toFixed(2));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <label className="text-sm font-medium text-arbisent-text">Stop Loss</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newStopLoss}
              onChange={(e) => setNewStopLoss(e.target.value)}
              placeholder="Enter stop loss price"
              className="w-32"
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleQuickStopLoss(2)}>2%</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickStopLoss(5)}>5%</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickStopLoss(10)}>10%</Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-arbisent-text">Take Profit</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newTakeProfit}
              onChange={(e) => setNewTakeProfit(e.target.value)}
              placeholder="Enter take profit price"
              className="w-32"
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleQuickTakeProfit(2)}>2%</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickTakeProfit(5)}>5%</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickTakeProfit(10)}>10%</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-32"
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
} 