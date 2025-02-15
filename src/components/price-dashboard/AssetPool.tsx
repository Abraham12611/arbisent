import { useEffect, useState } from "react";
import { Asset, AssetType, PriceServiceConfig } from "@/types/price-dashboard";
import { PriceService } from "@/services/price/price.service";
import { CoinGeckoService } from "@/services/price/coingecko.service";
import { CMCService } from "@/services/price/cmc.service";
import { DexPriceService } from "@/services/price/dex.service";

const ROTATION_INTERVAL = 120000; // 2 minutes in milliseconds
const ASSETS_PER_TYPE = 3; // Number of assets to show per type

interface AssetPoolProps {
  onAssetsUpdate: (assets: Asset[]) => void;
}

export const AssetPool = ({ onAssetsUpdate }: AssetPoolProps) => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const priceService = new PriceService({
      coingeckoApiKey: import.meta.env.VITE_COINGECKO_API_KEY,
      cmcApiKey: import.meta.env.VITE_CMC_API_KEY,
      etherscanApiKey: import.meta.env.VITE_ETHERSCAN_API_KEY,
    });

    // Register all services
    priceService.registerService(new CoinGeckoService(import.meta.env.VITE_COINGECKO_API_KEY));
    priceService.registerService(new CMCService(import.meta.env.VITE_CMC_API_KEY));
    priceService.registerService(new DexPriceService(import.meta.env.VITE_ETHERSCAN_API_KEY));

    const fetchAssets = async () => {
      try {
        const assets = await priceService.getAssets([
          AssetType.CRYPTO,
          AssetType.TOKEN,
          AssetType.MEMECOIN,
        ]);
        setAllAssets(assets);
        rotateAssets(assets);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
        // Keep the existing assets if there's an error
      }
    };

    // Initial fetch
    fetchAssets();

    // Set up periodic fetch
    const fetchInterval = setInterval(fetchAssets, ROTATION_INTERVAL);

    return () => clearInterval(fetchInterval);
  }, []);

  // Rotate assets whenever allAssets changes
  useEffect(() => {
    if (allAssets.length > 0) {
      rotateAssets(allAssets);
    }
  }, [allAssets]);

  // Update parent whenever displayed assets change
  useEffect(() => {
    onAssetsUpdate(displayedAssets);
  }, [displayedAssets, onAssetsUpdate]);

  const rotateAssets = (assets: Asset[]) => {
    const getRandomAssets = (type: AssetType, count: number) => {
      const typeAssets = assets.filter(asset => asset.type === type);
      const shuffled = [...typeAssets].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    const selectedAssets = [
      ...getRandomAssets(AssetType.CRYPTO, ASSETS_PER_TYPE),
      ...getRandomAssets(AssetType.TOKEN, ASSETS_PER_TYPE),
      ...getRandomAssets(AssetType.MEMECOIN, ASSETS_PER_TYPE),
    ];

    setDisplayedAssets(selectedAssets);
  };

  // Component doesn't render anything directly
  return null;
}; 