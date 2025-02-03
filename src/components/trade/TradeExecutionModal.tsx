import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TradeOrderForm } from "./TradeOrderForm";
import { TradeOrder } from "@/types/trade";
import { toast } from "sonner";

interface TradeExecutionModalProps {
  pair?: string;
  initialPrice?: number;
}

export const TradeExecutionModal = ({ pair, initialPrice }: TradeExecutionModalProps) => {
  const [open, setOpen] = useState(false);

  const handleTradeSubmit = async (order: TradeOrder) => {
    try {
      // TODO: Implement trade execution logic
      console.log("Executing trade:", order);
      toast.success("Trade executed successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Trade execution failed:", error);
      toast.error("Failed to execute trade. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-arbisent-accent hover:bg-arbisent-accent/90">
          Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-arbisent-secondary text-arbisent-text">
        <DialogHeader>
          <DialogTitle>Execute Trade</DialogTitle>
        </DialogHeader>
        <TradeOrderForm
          pair={pair}
          initialPrice={initialPrice}
          onSubmit={handleTradeSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};