import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

type SortField = "created_at" | "pair_name" | "type" | "side" | "entry_price" | "exit_price" | "amount" | "profit_loss" | "status";
type SortOrder = "asc" | "desc";

interface TradeHistoryProps {
  filters?: {
    dateRange?: { from: Date; to: Date };
    pair?: string;
    type?: string;
    status?: string;
    profitRange?: { min: number; max: number };
  };
}

const ITEMS_PER_PAGE = 10;

export const TradeHistory = ({ filters }: TradeHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades", currentPage, sortField, sortOrder, filters],
    queryFn: async () => {
      console.log("Fetching trades with filters:", { currentPage, sortField, sortOrder, filters });
      
      let query = supabase
        .from("trades")
        .select("*", { count: "exact" })
        .order(sortField, { ascending: sortOrder === "asc" })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (filters?.dateRange?.from && filters?.dateRange?.to) {
        query = query
          .gte("created_at", filters.dateRange.from.toISOString())
          .lte("created_at", filters.dateRange.to.toISOString());
      }

      if (filters?.pair) {
        query = query.ilike("pair_name", `%${filters.pair}%`);
      }

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.profitRange?.min !== undefined) {
        query = query.gte("profit_loss", filters.profitRange.min);
      }

      if (filters?.profitRange?.max !== undefined) {
        query = query.lte("profit_loss", filters.profitRange.max);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching trades:", error);
        throw error;
      }

      return {
        trades: data as Trade[],
        totalCount: count || 0
      };
    }
  });

  const totalPages = Math.ceil((trades?.totalCount || 0) / ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="created_at">Date/Time</SortableHeader>
              <SortableHeader field="pair_name">Trading Pair</SortableHeader>
              <SortableHeader field="type">Type</SortableHeader>
              <SortableHeader field="side">Side</SortableHeader>
              <SortableHeader field="entry_price">Entry Price</SortableHeader>
              <SortableHeader field="exit_price">Exit Price</SortableHeader>
              <SortableHeader field="amount">Amount</SortableHeader>
              <SortableHeader field="profit_loss">Profit/Loss</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades?.trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{format(new Date(trade.created_at), "PPp")}</TableCell>
                <TableCell>{trade.pair_name}</TableCell>
                <TableCell>{trade.type}</TableCell>
                <TableCell>{trade.side}</TableCell>
                <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                <TableCell>{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : "-"}</TableCell>
                <TableCell>{trade.amount}</TableCell>
                <TableCell 
                  className={cn(
                    trade.profit_loss && trade.profit_loss > 0 ? "text-green-500" : "text-red-500",
                    "font-medium"
                  )}
                >
                  {trade.profit_loss ? `$${trade.profit_loss.toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    trade.status === "Open" && "bg-blue-100 text-blue-800",
                    trade.status === "Closed" && "bg-green-100 text-green-800",
                    trade.status === "Cancelled" && "bg-red-100 text-red-800"
                  )}>
                    {trade.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {(!trades?.trades || trades.trades.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No trades found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={cn(
                  "cursor-pointer",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};