import { Asset, AssetType, PriceSource } from "@/types/price-dashboard";
import { BasePriceService } from "./price.service";

export class CMCService extends BasePriceService {
  private readonly API_URL = "https://pro-api.coinmarketcap.com/v1";
  
  constructor(private apiKey: string) {
    super();
  }

  getName(): string {
    return "CoinMarketCap";
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    try {
      const response = await fetch(
        `${this.API_URL}/cryptocurrency/listings/latest?limit=100`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from CMC");
      }

      const { data } = await response.json();
      return data.map((coin: any) => ({
        id: coin.id.toString(),
        name: coin.name,
        symbol: coin.symbol,
        type: this.determineAssetType(coin),
        price: coin.quote.USD.price,
        priceChange24h: coin.quote.USD.percent_change_24h,
        marketCap: coin.quote.USD.market_cap,
        volume24h: coin.quote.USD.volume_24h,
        lastUpdated: new Date(),
        source: PriceSource.CMC
      }));
    } catch (error) {
      console.error("CMC API error:", error);
      return [];
    }
  }

  private determineAssetType(coin: any): AssetType {
    // CMC specific logic for asset type determination
    if (coin.cmc_rank <= 20) return AssetType.CRYPTO;
    if (coin.cmc_rank <= 100) return AssetType.TOKEN;
    return AssetType.MEMECOIN;
  }
} 