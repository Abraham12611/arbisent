import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { MarketAnalysisModal } from "./MarketAnalysisModal";

export const TradingContextCards = () => {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card 
          className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
          onClick={() => setIsAnalysisModalOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-400">Market Analysis</h3>
            </div>
            <p className="text-sm text-gray-500">Analyze current market conditions and trends</p>
          </CardContent>
        </Card>
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-400">Portfolio</h3>
            </div>
            <p className="text-sm text-gray-500">View and manage your active positions</p>
          </CardContent>
        </Card>
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-400">Risk Analysis</h3>
            </div>
            <p className="text-sm text-gray-500">Evaluate potential risks and rewards</p>
          </CardContent>
        </Card>
      </div>

      <MarketAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
      />
    </>
  );
};