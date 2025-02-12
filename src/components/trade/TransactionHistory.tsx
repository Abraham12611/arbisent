import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { TradeStatusCard } from './TradeStatusCard';
import { useTradeStatus } from '@/hooks/useTradeStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  executing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export function TransactionHistory() {
  const [selectedTx, setSelectedTx] = useState<string>();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();

  const {
    transactions,
    total,
    totalPages,
    currentPage,
    pageSize,
    filters,
    isLoading,
    error,
    assetDistribution,
    successRate,
    updateFilters,
    updatePagination,
    searchTransactions
  } = useTransactionHistory('current-user-id'); // This should come from auth context

  const { execution, updates } = useTradeStatus(selectedTx);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length >= 3) {
      const results = await searchTransactions(value);
      // Handle search results
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading transactions: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
          <DatePickerWithRange
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              updateFilters({
                startDate: range?.from,
                endDate: range?.to
              });
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(assetDistribution).map(([asset, amount]) => (
                <div key={asset} className="flex justify-between">
                  <span>{asset}</span>
                  <span>{amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Select
            value={filters.status?.[0]}
            onValueChange={(value) => updateFilters({ status: value ? [value] : undefined })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => updatePagination({ page: currentPage - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => updatePagination({ page: currentPage + 1 })}
            >
              Next
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead>Gas Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTx(tx.id)}
                  >
                    <TableCell>
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{tx.asset}</TableCell>
                    <TableCell>{tx.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[tx.status]}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.transactionHash ? (
                        <span className="font-mono">
                          {tx.transactionHash.slice(0, 8)}...
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.gasUsed ? `${tx.gasUsed} gwei` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selectedTx && execution && (
        <TradeStatusCard
          execution={execution}
          updates={updates}
          className="mt-4"
        />
      )}
    </div>
  );
} 