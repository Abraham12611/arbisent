import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const PerformanceAnalytics = ({ dateRange }: { dateRange?: { from: Date; to: Date } }) => {
  const [dateRangeState, setDateRange] = useState<{ from: Date; to: Date } | undefined>(dateRange);

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["performance-analytics", dateRangeState],
    queryFn: async () => {
      console.log("Fetching performance analytics with date range:", dateRangeState);
      
      let query = supabase
        .from("trades")
        .select("*")
        .eq("status", "Closed");

      if (dateRangeState?.from && dateRangeState?.to) {
        query = query
          .gte("created_at", dateRangeState.from.toISOString())
          .lte("created_at", dateRangeState.to.toISOString());
      }

      const { data: trades, error } = await query;

      if (error) {
        console.error("Error fetching performance data:", error);
        throw error;
      }

      // Calculate success rate over time
      const successRateData = trades.reduce((acc: any[], trade) => {
        const date = format(new Date(trade.created_at), "yyyy-MM-dd");
        const existingDay = acc.find(item => item.date === date);
        
        if (existingDay) {
          existingDay.total += 1;
          existingDay.successful += trade.profit_loss > 0 ? 1 : 0;
          existingDay.rate = (existingDay.successful / existingDay.total) * 100;
        } else {
          acc.push({
            date,
            total: 1,
            successful: trade.profit_loss > 0 ? 1 : 0,
            rate: trade.profit_loss > 0 ? 100 : 0
          });
        }
        return acc;
      }, []);

      // Calculate profit/loss distribution
      const profitLossData = trades.reduce((acc: any[], trade) => {
        const range = Math.floor(trade.profit_loss / 100) * 100;
        const existingRange = acc.find(item => item.range === range);
        
        if (existingRange) {
          existingRange.count += 1;
        } else {
          acc.push({ range, count: 1 });
        }
        return acc;
      }, []).sort((a: any, b: any) => a.range - b.range);

      // Calculate trading volume over time
      const volumeData = trades.reduce((acc: any[], trade) => {
        const date = format(new Date(trade.created_at), "yyyy-MM-dd");
        const existingDay = acc.find(item => item.date === date);
        
        if (existingDay) {
          existingDay.volume += trade.amount;
        } else {
          acc.push({ date, volume: trade.amount });
        }
        return acc;
      }, []);

      // Calculate overall win/loss ratio
      const winLossRatio = {
        wins: trades.filter(trade => trade.profit_loss > 0).length,
        losses: trades.filter(trade => trade.profit_loss < 0).length,
        ratio: trades.filter(trade => trade.profit_loss > 0).length / 
               Math.max(1, trades.filter(trade => trade.profit_loss < 0).length)
      };

      return {
        successRateData,
        profitLossData,
        volumeData,
        winLossRatio
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return String(value);
  };

  const chartConfig = {
    success: {
      theme: {
        light: "#10B981",
        dark: "#10B981"
      }
    },
    volume: {
      theme: {
        light: "#6366F1",
        dark: "#6366F1"
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DatePickerWithRange
          value={dateRangeState}
          onChange={(value: any) => setDateRange(value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Success Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData?.successRateData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Date
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {format(new Date(payload[0].payload.date), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Success Rate
                                  </span>
                                  <span className="font-bold">
                                    {formatValue(payload[0].value)}%
                                  </span>
                                </div>
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profit/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Profit/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData?.profitLossData}>
                  <XAxis 
                    dataKey="range"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      value,
                      name === "count" ? "Trades" : name
                    ]}
                    labelFormatter={(label) => `$${label} to $${label + 100}`}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366F1"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trading Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData?.volumeData}>
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Date
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {format(new Date(payload[0].payload.date), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Volume
                                  </span>
                                  <span className="font-bold">
                                    {formatValue(payload[0].value)}
                                  </span>
                                </div>
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Ratio */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Winning Trades</span>
                  <span className="text-2xl font-bold text-green-500">
                    {performanceData?.winLossRatio.wins}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Losing Trades</span>
                  <span className="text-2xl font-bold text-red-500">
                    {performanceData?.winLossRatio.losses}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Win/Loss Ratio</span>
                  <span className="text-2xl font-bold">
                    {performanceData?.winLossRatio.ratio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
