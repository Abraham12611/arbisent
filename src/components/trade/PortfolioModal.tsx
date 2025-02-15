import { useState } from "react";
import { X } from "lucide-react";
import { ActivePositionsView } from "./ActivePositionsView";
import { HistoryView } from "@/components/analytics/HistoryView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortfolioModal = ({ isOpen, onClose }: PortfolioModalProps) => {
  const [activeTab, setActiveTab] = useState("positions");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#151822] border border-arbisent-border rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-arbisent-border">
          <h2 className="text-lg font-semibold text-arbisent-text">Portfolio Management</h2>
          <button
            onClick={onClose}
            className="text-arbisent-text/60 hover:text-arbisent-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs defaultValue="positions" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="positions">Active Positions</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="positions" className="mt-0">
              <ActivePositionsView />
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <HistoryView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 