import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function DataExportSection() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportTrades = async () => {
    try {
      setIsExporting(true);
      const { data: trades, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert trades to CSV format
      const headers = ["Date", "Pair", "Type", "Side", "Entry Price", "Exit Price", "Amount", "Profit/Loss", "Status"];
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

      // Create CSV content
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
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Download your trading history and account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Trading History</h4>
              <p className="text-sm text-muted-foreground">
                Export your complete trading history as CSV
              </p>
            </div>
            <Button 
              onClick={handleExportTrades} 
              disabled={isExporting}
              variant="outline"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}