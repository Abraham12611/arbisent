import { useEffect, useState } from "react";
import { Asset, AssetType, PriceServiceConfig } from "@/types/price-dashboard";
import { PriceService } from "@/services/price/price.service";
import { CoinGeckoService } from "@/services/price/coingecko.service";
import { CMCService } from "@/services/price/cmc.service";
import { DexPriceService } from "@/services/price/dex.service";
import { toast } from "sonner";

const ROTATION_INTERVAL = 120000; // 2 minutes in milliseconds
const ASSETS_PER_TYPE = 3; // Number of assets to show per type
const RETRY_DELAY = 5000; // 5 seconds before retrying failed requests

interface AssetPoolProps {
  onAssetsUpdate: (assets: Asset[]) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const AssetPool = ({ onAssetsUpdate, onLoadingChange }: AssetPoolProps) => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    const priceService = new PriceService({});

    // Register CoinGecko service (works with or without API key)
    const coingeckoApiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    try {
      priceService.registerService(new CoinGeckoService(coingeckoApiKey));
    } catch (error) {
      console.error('Failed to initialize CoinGecko service:', error);
      toast.error('Failed to initialize CoinGecko service');
    }

    // Try to register CMC service (optional)
    const cmcApiKey = import.meta.env.VITE_CMC_API_KEY;
    if (cmcApiKey) {
      try {
        priceService.registerService(new CMCService(cmcApiKey));
      } catch (error) {
        console.error('Failed to initialize CMC service:', error);
      }
    }

    // Try to register DEX service (optional)
    const etherscanApiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (etherscanApiKey) {
      try {
        priceService.registerService(new DexPriceService(etherscanApiKey));
      } catch (error) {
        console.error('Failed to initialize DEX service:', error);
      }
    }

    // Check if at least one service is registered
    if (priceService.getServiceCount() === 0) {
      const errorMsg = 'Failed to initialize any price services. Please check the console for errors.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    const fetchAssets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching assets...'); // Debug log
        const assets = await priceService.getAssets([
          AssetType.CRYPTO,
          AssetType.TOKEN,
          AssetType.MEMECOIN,
        ]);

        console.log('Fetched assets:', assets); // Debug log

        if (assets.length === 0) {
          throw new Error('No assets returned from any service');
        }

        setAllAssets(assets);
        rotateAssets(assets);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch assets';
        console.error(errorMessage, error);
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Retry after delay if we have no assets
        if (allAssets.length === 0) {
          setTimeout(fetchAssets, RETRY_DELAY);
        }
      } finally {
        setIsLoading(false);
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

  return null; // Component doesn't render anything directly
}; 