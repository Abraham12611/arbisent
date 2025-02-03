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

interface TakeProfitFormProps {
  position: Trade;
}

export function TakeProfitForm({ position }: TakeProfitFormProps) {
  const [open, setOpen] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const takeProfitValue = parseFloat(takeProfit);
    if (isNaN(takeProfitValue)) {
      toast.error("Please enter a valid take profit price");
      return;
    }

    const { error } = await supabase
      .from('trades')
      .update({ take_profit: takeProfitValue })
      .eq('id', position.id);

    if (error) {
      toast.error("Failed to set take profit");
      console.error("Error setting take profit:", error);
      return;
    }

    toast.success("Take profit set successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set TP
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Take Profit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="takeProfit">Take Profit Price</Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Enter take profit price"
            />
          </div>
          <Button type="submit">Set Take Profit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}