import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TransactionReceiptProps {
  status: 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
  details: {
    pair: string;
    amount: number;
    buyPrice: number;
    sellPrice: number;
    estimatedProfit: number;
    gas: number;
  };
  onClose: () => void;
}

export function TransactionReceipt({
  status,
  txHash,
  error,
  details,
  onClose
}: TransactionReceiptProps) {
  return (
    <Card className="bg-[#151822]/80 border-gray-800">
      <CardContent className="p-4 space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'pending' && (
              <>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-sm font-medium">Transaction Pending</span>
              </>
            )}
            {status === 'success' && (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Transaction Successful</span>
              </>
            )}
            {status === 'error' && (
              <>
                <X className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Transaction Failed</span>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Transaction Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Trading Pair:</span>
            <span className="text-arbisent-text">{details.pair}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Amount:</span>
            <span className="text-arbisent-text">{formatPrice(details.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Buy Price:</span>
            <span className="text-arbisent-text">{formatPrice(details.buyPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Sell Price:</span>
            <span className="text-arbisent-text">{formatPrice(details.sellPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Estimated Profit:</span>
            <span className="text-green-500">{formatPrice(details.estimatedProfit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-arbisent-text/60">Gas Fee:</span>
            <span className="text-arbisent-text">{formatPrice(details.gas)}</span>
          </div>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <div className="text-xs text-arbisent-text/60">
            Transaction Hash: <span className="font-mono">{txHash}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 