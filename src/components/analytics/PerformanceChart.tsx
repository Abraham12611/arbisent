import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const mockData = [
  { date: "2024-01", profit: 2500 },
  { date: "2024-02", profit: 3800 },
  { date: "2024-03", profit: 3200 },
  { date: "2024-04", profit: 4100 },
];

export const PerformanceChart = () => {
  const [data] = useState(mockData);

  return (
    <div className="w-full h-[400px] bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-arbisent-text mb-4">Performance History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-black/80 border border-arbisent-text/10 p-2 rounded">
                    <p className="text-arbisent-text">
                      Profit: ${payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#0567AB"
            strokeWidth={2}
            dot={{ fill: "#0567AB" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};