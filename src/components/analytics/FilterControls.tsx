import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FilterControlsProps {
  onFiltersChange: (filters: {
    dateRange?: { from: Date; to: Date };
    pair?: string;
    type?: string;
    status?: string;
    profitRange?: { min: number; max: number };
  }) => void;
}

export function FilterControls({ onFiltersChange }: FilterControlsProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();
  const [pair, setPair] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [minProfit, setMinProfit] = useState<string>("");
  const [maxProfit, setMaxProfit] = useState<string>("");

  const handleExport = async () => {
    try {
      let query = supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (pair) {
        query = query.ilike("pair_name", `%${pair}%`);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (minProfit) {
        query = query.gte("profit_loss", parseFloat(minProfit));
      }

      if (maxProfit) {
        query = query.lte("profit_loss", parseFloat(maxProfit));
      }

      const { data: trades, error } = await query;

      if (error) throw error;

      // Convert trades to CSV format
      const headers = [
        "Date",
        "Pair",
        "Type",
        "Side",
        "Entry Price",
        "Exit Price",
        "Amount",
        "Profit/Loss",
        "Status"
      ];

      const csvData = trades?.map(trade => [
        new Date(trade.created_at).toLocaleDateString(),
        trade.pair_name,
        trade.type,
        trade.side,
        trade.entry_price,
        trade.exit_price || "",
        trade.amount,
        trade.profit_loss || "",
        trade.status
      ]);

      const csvContent = [
        headers.join(","),
        ...(csvData?.map(row => row.join(",")) || [])
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trading-history-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Trading history exported successfully!");
    } catch (error: any) {
      toast.error("Failed to export trading history");
      console.error("Export error:", error);
    }
  };

  const handleFiltersChange = () => {
    const filters: any = {};
    
    if (dateRange) filters.dateRange = dateRange;
    if (pair) filters.pair = pair;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (minProfit || maxProfit) {
      filters.profitRange = {
        min: minProfit ? parseFloat(minProfit) : undefined,
        max: maxProfit ? parseFloat(maxProfit) : undefined
      };
    }

    onFiltersChange(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <DatePickerWithRange
          value={dateRange}
          onChange={(value: any) => {
            setDateRange(value);
            handleFiltersChange();
          }}
        />
        
        <Input
          placeholder="Search by pair..."
          value={pair}
          onChange={(e) => {
            setPair(e.target.value);
            handleFiltersChange();
          }}
          className="max-w-[200px]"
        />

        <Select
          value={type}
          onValueChange={(value) => {
            setType(value);
            handleFiltersChange();
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trade Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="limit">Limit</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            handleFiltersChange();
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          type="number"
          placeholder="Min Profit/Loss"
          value={minProfit}
          onChange={(e) => {
            setMinProfit(e.target.value);
            handleFiltersChange();
          }}
          className="max-w-[150px]"
        />
        <Input
          type="number"
          placeholder="Max Profit/Loss"
          value={maxProfit}
          onChange={(e) => {
            setMaxProfit(e.target.value);
            handleFiltersChange();
          }}
          className="max-w-[150px]"
        />
      </div>
    </div>
  );
}