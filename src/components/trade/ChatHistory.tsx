import { useEffect, useRef } from 'react';
import { Message } from '@/hooks/useTradeNLU';
import { ArbitrageMessage } from './ArbitrageMessage';
import { cn } from '@/lib/utils';

interface ChatHistoryProps {
  messages: Message[];
  onTradeExecute?: (tradeData: any) => Promise<void>;
  onFlashLoanExecute?: (tradeData: any) => Promise<void>;
}

export function ChatHistory({ 
  messages,
  onTradeExecute,
  onFlashLoanExecute,
}: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'flex w-full',
            message.type === 'text' ? 'justify-start' : 'justify-end'
          )}
        >
          <div className="max-w-[80%] rounded-lg p-4 bg-background border">
            {message.type === 'arbitrage' ? (
              <ArbitrageMessage
                opportunities={message.data.opportunities}
                pair={message.data.pair}
                onTradeExecute={onTradeExecute}
                onFlashLoanExecute={onFlashLoanExecute}
              />
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}