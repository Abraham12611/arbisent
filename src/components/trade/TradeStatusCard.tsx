import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { TradeExecution, TradeStatusUpdate, TradeStatus, StatusType } from '@/lib/status/types';

interface TradeStatusCardProps {
  execution: TradeExecution;
  updates: TradeStatusUpdate[];
  className?: string;
}

const StatusIcon: Record<TradeStatus | StatusType, any> = {
  pending: Loader2,
  executing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  info: Info,
  warning: AlertCircle,
  error: XCircle,
  success: CheckCircle2
};

const StatusColor: Record<TradeStatus | StatusType, string> = {
  pending: 'text-blue-500',
  executing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  success: 'text-green-500'
};

export function TradeStatusCard({ execution, updates, className = '' }: TradeStatusCardProps) {
  const Icon = StatusIcon[execution.status];
  const colorClass = StatusColor[execution.status];

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade Status</span>
          <Badge 
            variant={execution.status === 'failed' ? 'destructive' : 'default'}
            className="capitalize"
          >
            {execution.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Asset</p>
            <p className="font-medium">{execution.asset}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">{execution.amount}</p>
          </div>
          {execution.price && (
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">${execution.price}</p>
            </div>
          )}
          {execution.transactionHash && (
            <div>
              <p className="text-sm text-muted-foreground">Transaction</p>
              <p className="font-medium truncate">
                {execution.transactionHash.slice(0, 10)}...
              </p>
            </div>
          )}
        </div>

        <div className="border rounded-lg divide-y">
          {updates.map((update) => {
            const UpdateIcon = StatusIcon[update.status];
            const updateColorClass = StatusColor[update.status];

            return (
              <div
                key={update.id}
                className="flex items-start gap-3 p-3 text-sm"
              >
                <UpdateIcon 
                  className={`${updateColorClass} h-5 w-5 mt-0.5 flex-shrink-0`}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{update.message}</p>
                  {update.details && (
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(update.details, null, 2)}
                    </pre>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(update.createdAt), 'MMM d, h:mm:ss a')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {execution.gasUsed && execution.gasPrice && (
          <div className="text-sm text-muted-foreground">
            Gas used: {execution.gasUsed} @ {execution.gasPrice} gwei
          </div>
        )}
      </CardContent>
    </Card>
  );
} 