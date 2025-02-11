import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ParsedTradeMessage } from '@/lib/nlu/types';

interface TradeConfirmationProps {
  trade: ParsedTradeMessage;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function TradeConfirmation({ trade, onConfirm, onCancel }: TradeConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const formatParameter = (key: string, value: any) => {
    switch (key) {
      case 'amount':
        return `${value} ${trade.parameters.asset}`;
      case 'targetPrice':
        return `$${value}`;
      case 'slippage':
        return `${value}%`;
      default:
        return value;
    }
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Confirm Trade</span>
          <Badge variant={isConfirming ? "secondary" : "default"}>
            {trade.intent}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(trade.parameters).map(([key, value]) => (
            value && (
              <div key={key} className="space-y-1">
                <p className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="font-medium">
                  {formatParameter(key, value)}
                </p>
              </div>
            )
          ))}
        </div>

        {trade.intent === 'SCHEDULE_TRADE' && (
          <div className="rounded-lg bg-muted p-4 mt-4">
            <p className="text-sm font-medium">Recurring Trade Details</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>Frequency: {trade.parameters.frequency}</li>
              {trade.parameters.duration && (
                <li>Duration: {trade.parameters.duration}</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming
            </>
          ) : (
            'Confirm Trade'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 