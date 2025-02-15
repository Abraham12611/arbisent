import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { MarketAnalysisService } from "@/services/analysis/market-analysis.service";
import { MarketTrendChart } from "./MarketTrendChart";
import { OpportunityCard } from "./OpportunityCard";
import { AssetType } from "@/types/price-dashboard";

interface MarketAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisMessage {
  type: 'loading' | 'analysis' | 'error';
  content: string;
  timestamp: Date;
}

interface TrendData {
  type: AssetType;
  avgPriceChange: number;
  totalVolume: number;
}

interface Opportunity {
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

export const MarketAnalysisModal = ({ isOpen, onClose }: MarketAnalysisModalProps) => {
  const [messages, setMessages] = useState<AnalysisMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const analysisService = new MarketAnalysisService();

  const performAnalysis = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setMessages(prev => [
      ...prev,
      {
        type: 'loading',
        content: '🔄 Analyzing market conditions...',
        timestamp: new Date()
      }
    ]);

    try {
      const { insights, trendData, opportunities } = await analysisService.analyzeMarket();
      setTrends(trendData);
      setOpportunities(opportunities);
      
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'loading'),
        ...insights.map(content => ({
          type: 'analysis' as const,
          content,
          timestamp: new Date()
        }))
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'loading'),
        {
          type: 'error',
          content: '❌ Failed to analyze market. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start analysis when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      performAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#151822] border border-arbisent-border rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
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

        {/* Content */}
        <div className="p-4 h-[60vh] overflow-y-auto space-y-4">
          {/* Chart Section */}
          {trends.length > 0 && (
            <MarketTrendChart trends={trends} />
          )}

          {/* Opportunities Section */}
          {opportunities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-arbisent-text">Trading Opportunities</h3>
              {opportunities.map((opportunity, index) => (
                <OpportunityCard
                  key={`${opportunity.symbol}-${index}`}
                  {...opportunity}
                />
              ))}
            </div>
          )}

          {/* Messages Section */}
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-arbisent-text/60">
              🔄 Initializing market analysis...
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : message.type === 'loading'
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : 'bg-arbisent-background-light'
                  }`}
                >
                  <pre className="text-sm text-arbisent-text whitespace-pre-wrap font-sans">
                    {message.content}
                  </pre>
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
            onClick={performAnalysis}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-arbisent-primary text-arbisent-text rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 