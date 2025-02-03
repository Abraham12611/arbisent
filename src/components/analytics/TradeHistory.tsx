import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockTrades = [
  {
    id: 1,
    date: "2024-02-20",
    pair: "ETH/USDT",
    type: "Long",
    entry: 3200,
    exit: 3300,
    profit: 100,
    roi: 3.125,
  },
  // Add more mock trades as needed
];

export const TradeHistory = () => {
  return (
    <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-arbisent-text mb-4">Trade History</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>ROI %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.date}</TableCell>
                <TableCell>{trade.pair}</TableCell>
                <TableCell>{trade.type}</TableCell>
                <TableCell>${trade.entry}</TableCell>
                <TableCell>${trade.exit}</TableCell>
                <TableCell className={trade.profit >= 0 ? "text-green-500" : "text-red-500"}>
                  ${trade.profit}
                </TableCell>
                <TableCell className={trade.roi >= 0 ? "text-green-500" : "text-red-500"}>
                  {trade.roi}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};