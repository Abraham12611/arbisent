import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Database } from "@/integrations/supabase/types";

type PerformanceMetrics = Database['public']['Tables']['performance_metrics']['Row'];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PerformanceAnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["performance-metrics", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .single();

      if (error) throw error;
      return data as PerformanceMetrics;
    }
  });

  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ["trades", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("trades")
        .select("*")
        .eq("status", "Closed");

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (metricsLoading || tradesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const strategyPerformance = metrics?.strategy_performance as {
    name: string;
    success_rate: number;
    profit_loss: number;
    trade_count: number;
  }[] || [];

  const chainMetrics = metrics?.chain_specific_metrics as {
    chain_id: number;
    name: string;
    profit_loss: number;
    trade_count: number;
    gas_spent: number;
  }[] || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <DatePickerWithRange value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.total_profit_loss.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI: {metrics?.roi_percentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.win_rate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.winning_trades} / {metrics?.total_trades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.profit_factor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross profit / Gross loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {metrics?.max_drawdown.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Largest peak to trough decline
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit/Loss Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trades}>
                      <XAxis 
                        dataKey="created_at" 
                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [`$${value}`, "Profit/Loss"]}
                        labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit_loss" 
                        stroke="#0088FE"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Winning', value: metrics?.winning_trades },
                          { name: 'Losing', value: metrics?.losing_trades }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyPerformance}>
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                    <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="success_rate" fill="#0088FE" name="Success Rate (%)" />
                    <Bar yAxisId="right" dataKey="profit_loss" fill="#00C49F" name="Profit/Loss ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chain Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chainMetrics}>
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                    <YAxis yAxisId="right" orientation="right" stroke="#00C49F" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="profit_loss" fill="#0088FE" name="Profit/Loss ($)" />
                    <Bar yAxisId="right" dataKey="gas_spent" fill="#00C49F" name="Gas Spent ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 