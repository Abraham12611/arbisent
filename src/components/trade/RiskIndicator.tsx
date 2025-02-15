import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskIndicatorProps {
  position: {
    current_price: number;
    entry_price: number;
    stop_loss?: number;
    take_profit?: number;
    amount: number;
  };
  portfolioValue: number;
}

export function RiskIndicator({ position, portfolioValue }: RiskIndicatorProps) {
  const calculateRiskLevel = (): { level: 'LOW' | 'MEDIUM' | 'HIGH', message: string } => {
    // Calculate potential loss
    const stopLossDistance = position.stop_loss 
      ? Math.abs(position.current_price - position.stop_loss)
      : Math.abs(position.current_price - position.entry_price) * 0.1; // Assume 10% if no SL

    const potentialLoss = stopLossDistance * position.amount;
    const riskPercentage = (potentialLoss / portfolioValue) * 100;

    // Calculate risk/reward ratio if take profit is set
    const riskRewardRatio = position.take_profit
      ? Math.abs(position.take_profit - position.current_price) / stopLossDistance
      : 0;

    // Determine risk level
    if (!position.stop_loss) {
      return {
        level: 'HIGH',
        message: 'No stop-loss set - high risk of unlimited losses'
      };
    }

    if (riskPercentage > 5) {
      return {
        level: 'HIGH',
        message: `Position risks ${riskPercentage.toFixed(1)}% of portfolio value`
      };
    }

    if (riskRewardRatio < 1.5 && position.take_profit) {
      return {
        level: 'MEDIUM',
        message: `Risk/Reward ratio of ${riskRewardRatio.toFixed(1)} is below recommended 1.5`
      };
    }

    if (riskPercentage > 2) {
      return {
        level: 'MEDIUM',
        message: `Position risks ${riskPercentage.toFixed(1)}% of portfolio value`
      };
    }

    return {
      level: 'LOW',
      message: `Healthy position with ${riskPercentage.toFixed(1)}% portfolio risk`
    };
  };

  const risk = calculateRiskLevel();
  const colors = {
    LOW: 'text-green-500',
    MEDIUM: 'text-yellow-500',
    HIGH: 'text-red-500'
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`flex items-center gap-1 ${colors[risk.level]}`}>
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">{risk.level}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{risk.message}</p>
      </TooltipContent>
    </Tooltip>
  );
} 