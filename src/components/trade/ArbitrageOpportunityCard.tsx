import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyFrom: {
    dex: string;
    price: number;
  };
  sellAt: {
    dex: string;
    price: number;
  };
  profitPercentage: number;
  minAmount: number;
  estimatedGas: number;
  successChance: number;
}

interface ArbitrageOpportunityCardProps {
  opportunity: ArbitrageOpportunity;
  onTrade: (opportunity: ArbitrageOpportunity) => void;
  onFlashLoan: (opportunity: ArbitrageOpportunity) => void;
  isExecuting?: boolean;
}

export function ArbitrageOpportunityCard({
  opportunity,
  onTrade,
  onFlashLoan,
  isExecuting = false
}: ArbitrageOpportunityCardProps) {
  const getSuccessColor = (chance: number) => {
    if (chance >= 80) return "text-green-500";
    if (chance >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="bg-[#151822]/80 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-arbisent-text">{opportunity.pair}</h3>
            <p className="text-sm text-arbisent-text/60">
              Profit: <span className="text-green-500">{opportunity.profitPercentage.toFixed(2)}%</span>
            </p>
          </div>
          <div className={`text-sm font-medium ${getSuccessColor(opportunity.successChance)}`}>
            {opportunity.successChance}% Success Rate
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-2 rounded-lg bg-[#1A1D24]">
            <p className="text-xs text-arbisent-text/60 mb-1">Buy from {opportunity.buyFrom.dex}</p>
            <p className="text-sm font-medium text-arbisent-text">
              {formatPrice(opportunity.buyFrom.price)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#1A1D24]">
            <p className="text-xs text-arbisent-text/60 mb-1">Sell at {opportunity.sellAt.dex}</p>
            <p className="text-sm font-medium text-arbisent-text">
              {formatPrice(opportunity.sellAt.price)}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Minimum Amount:</span>
            <span className="text-arbisent-text">{formatPrice(opportunity.minAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Estimated Gas:</span>
            <span className="text-arbisent-text">{formatPrice(opportunity.estimatedGas)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onTrade(opportunity)}
            disabled={isExecuting}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                Trade
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <Button
            onClick={() => onFlashLoan(opportunity)}
            disabled={isExecuting}
            variant="outline"
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Trade with Flash Loan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 