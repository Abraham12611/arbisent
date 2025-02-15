import { useState } from "react";
import { CoinList } from "./price-dashboard/CoinList";
import { AssetPool } from "./price-dashboard/AssetPool";
import { LoadingSpinner } from "./price-dashboard/LoadingSpinner";
import { Asset } from "@/types/price-dashboard";
import { toast } from "sonner";

export const PriceDashboard = () => {
  const [currentAssets, setCurrentAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <section className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            Live Market
            <span className="text-arbisent-primary"> Overview</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            Real-time cryptocurrency, token, and memecoin prices.
          </p>
        </div>

        <AssetPool 
          onAssetsUpdate={setCurrentAssets} 
          onLoadingChange={setIsLoading}
        />

        {isLoading && currentAssets.length === 0 ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : (
          <CoinList assets={currentAssets} />
        )}
      </div>
    </section>
  );
};