import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
}

interface CoinRowProps {
  coin: CoinData;
}

export const CoinRow = ({ coin }: CoinRowProps) => {
  const addToWatchlist = async (coin: CoinData) => {
    try {
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
        if (error.code === "23505") {
          toast.error("This pair is already in your watchlist");
        } else {
          toast.error("Failed to add to watchlist");
        }
        return;
      }

      toast.success(`Added ${coin.name} to watchlist`);
    } catch (error: any) {
      console.error("Error in addToWatchlist:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  return (
    <tr className="border-t border-arbisent-text/10 hover:bg-white/5">
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
          {Math.abs(coin.price_change_percentage_7d_in_currency).toFixed(2)}%
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
  );
};