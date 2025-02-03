import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import { format } from "date-fns";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "@/components/ui/chart";

interface TradeData {
  date: string;
  profit: number;
}

interface Trade {
  created_at: string;
  profit_loss: number;
}

export const PerformanceChart = () => {
  const [data, setData] = useState<TradeData[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        let query = supabase
          .from("trades")
          .select("created_at, profit_loss")
          .eq("status", "Closed")
          .order("created_at", { ascending: true });

        if (dateRange?.from && dateRange?.to) {
          query = query
            .gte("created_at", dateRange.from.toISOString())
            .lte("created_at", dateRange.to.toISOString());
        }

        const { data: trades, error } = await query;

        if (error) {
          console.error("Error fetching trade data:", error);
          toast.error("Failed to fetch trade data");
          return;
        }

        // Group trades by date and calculate daily profit
        const dailyProfits = (trades as Trade[]).reduce((acc: { [key: string]: number }, trade) => {
          const date = format(new Date(trade.created_at), "yyyy-MM-dd");
          acc[date] = (acc[date] || 0) + Number(trade.profit_loss);
          return acc;
        }, {});

        const chartData = Object.entries(dailyProfits).map(([date, profit]) => ({
          date,
          profit,
        }));

        setData(chartData);
      } catch (error) {
        console.error("Error in fetchTradeData:", error);
        toast.error("An error occurred while fetching trade data");
      }
    };

    fetchTradeData();
  }, [dateRange]);

  const handleExport = () => {
    const csvContent = [
      ["Date", "Profit"],
      ...data.map(item => [item.date, item.profit.toString()])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "performance_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance History</CardTitle>
        <div className="flex items-center gap-4">
          <DatePickerWithRange
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            title="Export data"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
              />
              <Line
                dataKey="profit"
                stroke="#0567AB"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};