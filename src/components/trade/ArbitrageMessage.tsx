import { useState } from "react";
import { ArbitrageOpportunityCard } from "./ArbitrageOpportunityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

interface ArbitrageMessageProps {
  opportunities: ArbitrageOpportunity[];
  isLoading?: boolean;
  onTrade: (opportunity: ArbitrageOpportunity) => void;
  onFlashLoan: (opportunity: ArbitrageOpportunity) => void;
}

export function ArbitrageMessage({
  opportunities,
  isLoading = false,
  onTrade,
  onFlashLoan
}: ArbitrageMessageProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleTrade = async (opportunity: ArbitrageOpportunity) => {
    setExecutingId(opportunity.id);
    try {
      await onTrade(opportunity);
    } finally {
      setExecutingId(null);
    }
  };

  const handleFlashLoan = async (opportunity: ArbitrageOpportunity) => {
    setExecutingId(opportunity.id);
    try {
      await onFlashLoan(opportunity);
    } finally {
      setExecutingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#151822]/50 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-arbisent-text/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            Scanning for arbitrage opportunities...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card className="bg-[#151822]/50 border-gray-800">
        <CardContent className="p-4">
          <div className="text-arbisent-text/60">
            No profitable arbitrage opportunities found at the moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-arbisent-text/60 mb-2">
        Found {opportunities.length} potential arbitrage opportunities:
      </div>
      {opportunities.map((opportunity) => (
        <ArbitrageOpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          onTrade={handleTrade}
          onFlashLoan={handleFlashLoan}
          isExecuting={executingId === opportunity.id}
        />
      ))}
    </div>
  );
} 