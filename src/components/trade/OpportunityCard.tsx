import { Copy, Bell, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OpportunityCardProps {
  symbol: string;
  profitPercentage: number;
  buyFrom: {
    source: string;
    price: number;
  };
  sellAt: {
    source: string;
    price: number;
  };
  estimatedProfit: number;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const OpportunityCard = ({
  symbol,
  profitPercentage,
  buyFrom,
  sellAt,
  estimatedProfit,
  confidence,
  risk
}: OpportunityCardProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isAlertSet, setIsAlertSet] = useState(false);

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-red-500';
    }
  };

  const copyDetails = () => {
    const details = `
Trading Opportunity for ${symbol}:
- Profit Potential: ${profitPercentage.toFixed(2)}%
- Buy from ${buyFrom.source} at $${buyFrom.price.toFixed(2)}
- Sell on ${sellAt.source} at $${sellAt.price.toFixed(2)}
- Estimated Profit: $${estimatedProfit.toFixed(2)}
- Confidence: ${(confidence * 100).toFixed(0)}%
- Risk Level: ${risk}
    `.trim();

    navigator.clipboard.writeText(details);
    toast.success('Trade details copied to clipboard');
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved opportunities' : 'Added to saved opportunities');
    // TODO: Implement actual save functionality
  };

  const toggleAlert = () => {
    setIsAlertSet(!isAlertSet);
    toast.success(isAlertSet ? 'Alert removed' : 'Alert set for this opportunity');
    // TODO: Implement actual alert functionality
  };

  return (
    <Card className="p-4 bg-arbisent-background-light border-arbisent-border hover:border-arbisent-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-medium text-arbisent-text">{symbol}</h4>
          <p className="text-sm text-arbisent-text/60">Profit Potential: {profitPercentage.toFixed(2)}%</p>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyDetails}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy trade details</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSave}
                className="h-8 w-8 p-0"
              >
                {isSaved ? (
                  <BookmarkCheck className="h-4 w-4 text-arbisent-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSaved ? 'Remove from saved' : 'Save opportunity'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAlert}
                className="h-8 w-8 p-0"
              >
                <Bell className={isAlertSet ? "h-4 w-4 text-arbisent-primary" : "h-4 w-4"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isAlertSet ? 'Remove alert' : 'Set alert'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="p-2 rounded-lg bg-arbisent-background">
          <p className="text-xs text-arbisent-text/60 mb-1">Buy from</p>
          <p className="text-sm text-arbisent-text">{buyFrom.source}</p>
          <p className="text-sm font-medium text-arbisent-text">${buyFrom.price.toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-arbisent-background">
          <p className="text-xs text-arbisent-text/60 mb-1">Sell at</p>
          <p className="text-sm text-arbisent-text">{sellAt.source}</p>
          <p className="text-sm font-medium text-arbisent-text">${sellAt.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-arbisent-text/60">
          Confidence: <span className="text-arbisent-text">{(confidence * 100).toFixed(0)}%</span>
        </span>
        <span className="text-arbisent-text/60">
          Risk: <span className={getRiskColor(risk)}>{risk}</span>
        </span>
      </div>
    </Card>
  );
}; 