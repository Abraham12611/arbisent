import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { toast } from "sonner";

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

export const PriceDashboard = () => {
  const [watchedPairs, setWatchedPairs] = useState<any[]>([]);

  // Fetch crypto data from CoinGecko
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

  useEffect(() => {
    const channel = supabase
      .channel("watched_pairs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watched_pairs",
        },
        (payload) => {
          console.log("Change received!", payload);
          fetchWatchedPairs();
        }
      )
      .subscribe();

    fetchWatchedPairs();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWatchedPairs = async () => {
    try {
      const { data, error } = await supabase
        .from("watched_pairs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching watched pairs:", error);
        toast.error("Failed to fetch watched pairs");
        return;
      }

      setWatchedPairs(data);
    } catch (error: any) {
      console.error("Error in fetchWatchedPairs:", error);
      toast.error("An error occurred while fetching watched pairs");
    }
  };

  const addToWatchlist = async (coin: CoinData) => {
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Authentication error. Please try again.");
        return;
      }

      if (!session) {
        toast.error("Please login to add to watchlist");
        return;
      }

      const { error } = await supabase.from("watched_pairs").insert({
        user_id: session.user.id,
        pair_name: coin.symbol.toUpperCase() + "/USD",
        pair_address: coin.id,
        dex_name: "CoinGecko",
      });

      if (error) {
        console.error("Error adding to watchlist:", error);
        if (error.code === "23505") { // Unique violation
          toast.error("This pair is already in your watchlist");
        } else {
          toast.error("Failed to add to watchlist");
        }
        return;
      }

      toast.success(`Added ${coin.name} to watchlist`);
    } catch (error: any) {
      console.error("Error in addToWatchlist:", error);
      if (error.message?.includes("rejected")) {
        toast.error("Request was cancelled. Please try again.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-arbisent-primary"></div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            Live Market
            <span className="text-arbisent-primary"> Overview</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            Real-time cryptocurrency prices and market data from top exchanges.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-arbisent-text/70">
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">24h Change</th>
                <th className="px-6 py-3">7d Change</th>
                <th className="px-6 py-3">Market Cap</th>
                <th className="px-6 py-3">Volume (24h)</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coinData?.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-t border-arbisent-text/10 hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <span className="font-medium text-arbisent-text">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-arbisent-text">
                    ${coin.current_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1 ${
                        coin.price_change_percentage_24h >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {coin.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1 ${
                        coin.price_change_percentage_7d_in_currency >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {coin.price_change_percentage_7d_in_currency >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(
                        coin.price_change_percentage_7d_in_currency
                      ).toFixed(2)}
                      %
                    </span>
                  </td>
                  <td className="px-6 py-4 text-arbisent-text">
                    ${coin.market_cap.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-arbisent-text">
                    ${coin.total_volume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => addToWatchlist(coin)}
                      className="p-2 hover:bg-arbisent-primary/10 rounded-full transition-colors"
                      title="Add to watchlist"
                    >
                      <Plus className="w-4 h-4 text-arbisent-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
