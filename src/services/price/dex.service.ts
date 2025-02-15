import { Asset, AssetType, PriceSource } from "@/types/price-dashboard";
import { BasePriceService } from "./price.service";

interface TokenPair {
  address: string;
  symbol: string;
  name: string;
  pairAddress: string;
}

export class DexPriceService extends BasePriceService {
  private readonly ETHERSCAN_API_URL = "https://api.etherscan.io/api";
  private readonly UNISWAP_PAIRS: TokenPair[] = [
    // Add popular memecoin pairs here
    {
      address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
      symbol: "SHIB",
      name: "Shiba Inu",
      pairAddress: "0x811beed0119b4afce20d2583eb608c6f7af1954f"
    },
    // Add more pairs as needed
  ];
  
  constructor(private etherscanApiKey: string) {
    super();
  }

  getName(): string {
    return "DEX";
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    // Only process if MEMECOIN type is requested
    if (!types.includes(AssetType.MEMECOIN)) {
      return [];
    }

    try {
      const assets: Asset[] = [];
      
      for (const pair of this.UNISWAP_PAIRS) {
        const pairData = await this.getPairData(pair);
        if (pairData) {
          assets.push(pairData);
        }
      }

      return assets;
    } catch (error) {
      console.error("DEX API error:", error);
      return [];
    }
  }

  private async getPairData(pair: TokenPair): Promise<Asset | null> {
    try {
      // Get latest pair transactions to calculate price
      const response = await fetch(
        `${this.ETHERSCAN_API_URL}?module=account&action=tokentx&contractaddress=${pair.pairAddress}&apikey=${this.etherscanApiKey}&sort=desc&limit=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from Etherscan");
      }

      const { result } = await response.json();
      if (!result || !result[0]) {
        return null;
      }

      // Simple price calculation from latest transaction
      // In production, you'd want more sophisticated price calculation
      const latestTx = result[0];
      const price = parseFloat(latestTx.value) / Math.pow(10, 18);

      return {
        id: pair.address,
        name: pair.name,
        symbol: pair.symbol,
        type: AssetType.MEMECOIN,
        price,
        priceChange24h: 0, // Would need historical data for this
        marketCap: 0, // Would need total supply for this
        volume24h: 0, // Would need 24h trading data
        lastUpdated: new Date(),
        source: PriceSource.DEX
      };
    } catch (error) {
      console.error(`Failed to get data for pair ${pair.symbol}:`, error);
      return null;
    }
  }
} 