import { Button } from "@/components/ui/button";

interface PositionControlsProps {
  totalPositions: number;
  totalValue: number;
}

export function PositionControls({ totalPositions, totalValue }: PositionControlsProps) {
  const handleCloseAll = () => {
    // Implement close all positions functionality
    console.log("Close all positions clicked");
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="space-x-2">
        <Button variant="outline" onClick={handleCloseAll}>Close All</Button>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          Total Positions: {totalPositions}
        </span>
        <span className="text-sm text-muted-foreground">
          Total Value: ${totalValue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}