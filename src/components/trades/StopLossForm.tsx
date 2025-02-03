import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trade } from "@/types/trade";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StopLossFormProps {
  position: Trade;
}

export function StopLossForm({ position }: StopLossFormProps) {
  const [open, setOpen] = useState(false);
  const [stopLoss, setStopLoss] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stopLossValue = parseFloat(stopLoss);
    if (isNaN(stopLossValue)) {
      toast.error("Please enter a valid stop loss price");
      return;
    }

    const { error } = await supabase
      .from('trades')
      .update({ stop_loss: stopLossValue })
      .eq('id', position.id);

    if (error) {
      toast.error("Failed to set stop loss");
      console.error("Error setting stop loss:", error);
      return;
    }

    toast.success("Stop loss set successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set SL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Stop Loss</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="stopLoss">Stop Loss Price</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Enter stop loss price"
            />
          </div>
          <Button type="submit">Set Stop Loss</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}