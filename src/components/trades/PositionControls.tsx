import { Button } from "@/components/ui/button";
import { TradeExecutionModal } from "../trade/TradeExecutionModal";

export function PositionControls() {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="space-x-2">
        <TradeExecutionModal />
        <Button variant="outline">Close All</Button>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          Total Positions: 0
        </span>
        <span className="text-sm text-muted-foreground">
          Total Value: $0.00
        </span>
      </div>
    </div>
  );
}