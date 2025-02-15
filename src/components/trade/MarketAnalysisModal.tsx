import { useState } from "react";
import { X } from "lucide-react";

interface MarketAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisMessage {
  type: 'loading' | 'analysis' | 'error';
  content: string;
  timestamp: Date;
}

export const MarketAnalysisModal = ({ isOpen, onClose }: MarketAnalysisModalProps) => {
  const [messages, setMessages] = useState<AnalysisMessage[]>([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#151822] border border-arbisent-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-arbisent-border">
          <h2 className="text-lg font-semibold text-arbisent-text">Market Analysis</h2>
          <button
            onClick={onClose}
            className="text-arbisent-text/60 hover:text-arbisent-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="p-4 h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-arbisent-text/60">
              Initializing market analysis...
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-arbisent-background-light'
                  }`}
                >
                  <div className="text-sm text-arbisent-text">{message.content}</div>
                  <div className="text-xs text-arbisent-text/60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-arbisent-border">
          <button
            onClick={() => {/* TODO: Implement refresh */}}
            className="w-full px-4 py-2 bg-arbisent-primary text-arbisent-text rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Refresh Analysis
          </button>
        </div>
      </div>
    </div>
  );
}; 