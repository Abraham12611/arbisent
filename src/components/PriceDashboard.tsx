import { useState } from "react";
import { CoinList } from "./price-dashboard/CoinList";
import { AssetPool } from "./price-dashboard/AssetPool";
import { Asset } from "@/types/price-dashboard";

export const PriceDashboard = () => {
  const [currentAssets, setCurrentAssets] = useState<Asset[]>([]);

  return (
    <section className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            Live Market
            <span className="text-arbisent-primary"> Overview</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            Real-time cryptocurrency, token, and memecoin prices rotating every 2 minutes.
          </p>
        </div>
        <AssetPool onAssetsUpdate={setCurrentAssets} />
        <CoinList assets={currentAssets} />
      </div>
    </section>
  );
};