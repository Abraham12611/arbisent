import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CoinRow } from "./CoinRow";
import { CoinTableHeader } from "./CoinTableHeader";
import { LoadingSpinner } from "./LoadingSpinner";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: {
    price: number[];
  };
}

export const CoinList = () => {
  const { data: coinData, isLoading } = useQuery({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch crypto data");
        }
        return response.json() as Promise<CoinData[]>;
      } catch (error: any) {
        console.error("Error fetching crypto data:", error);
        toast.error("Failed to fetch crypto data. Please try again later.");
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <CoinTableHeader />
        <tbody>
          {coinData?.map((coin) => (
            <CoinRow key={coin.id} coin={coin} />
          ))}
        </tbody>
      </table>
    </div>
  );
};