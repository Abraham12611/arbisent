import { Asset, AssetType } from "@/types/price-dashboard";
import { PriceService } from "@/services/price/price.service";

interface ArbitrageOpportunity {
  sourceAsset: Asset;
  targetAsset: Asset;
  priceDifference: number;
  potentialProfit: number;
  confidence: number;
}

export class MarketAnalysisService {
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
  }

  async analyzeMarket(): Promise<string[]> {
    const insights: string[] = [];
    
    try {
      // Get assets from all sources
      const assets = await this.priceService.getAssets([
        AssetType.CRYPTO,
        AssetType.TOKEN,
        AssetType.MEMECOIN
      ]);

      // Group assets by symbol for comparison
      const assetsBySymbol = this.groupAssetsBySymbol(assets);
      
      // Find arbitrage opportunities
      const opportunities = this.findArbitrageOpportunities(assetsBySymbol);
      
      // Generate insights
      if (opportunities.length === 0) {
        insights.push("No significant arbitrage opportunities found at the moment.");
      } else {
        insights.push(`Found ${opportunities.length} potential arbitrage opportunities:`);
        
        opportunities.forEach(opp => {
          const profitPercentage = (opp.priceDifference / opp.sourceAsset.price) * 100;
          insights.push(
            `${opp.sourceAsset.symbol}: ${profitPercentage.toFixed(2)}% potential profit ` +
            `between ${opp.sourceAsset.source} (${opp.sourceAsset.price.toFixed(2)}) and ` +
            `${opp.targetAsset.source} (${opp.targetAsset.price.toFixed(2)}) ` +
            `[Confidence: ${(opp.confidence * 100).toFixed(0)}%]`
          );
        });
      }

      // Add market summary
      insights.push(this.generateMarketSummary(assets));

    } catch (error) {
      console.error('Market analysis error:', error);
      insights.push('Error analyzing market data. Please try again.');
    }

    return insights;
  }

  private groupAssetsBySymbol(assets: Asset[]): Map<string, Asset[]> {
    const grouped = new Map<string, Asset[]>();
    
    assets.forEach(asset => {
      const existing = grouped.get(asset.symbol) || [];
      grouped.set(asset.symbol, [...existing, asset]);
    });
    
    return grouped;
  }

  private findArbitrageOpportunities(assetsBySymbol: Map<string, Asset[]>): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    assetsBySymbol.forEach(assets => {
      if (assets.length < 2) return;
      
      // Compare each pair of assets
      for (let i = 0; i < assets.length; i++) {
        for (let j = i + 1; j < assets.length; j++) {
          const priceDiff = Math.abs(assets[i].price - assets[j].price);
          const avgPrice = (assets[i].price + assets[j].price) / 2;
          const priceDeviation = priceDiff / avgPrice;
          
          // Only consider significant price differences (>1%)
          if (priceDeviation > 0.01) {
            const confidence = this.calculateConfidence(assets[i], assets[j]);
            
            opportunities.push({
              sourceAsset: assets[i].price < assets[j].price ? assets[i] : assets[j],
              targetAsset: assets[i].price < assets[j].price ? assets[j] : assets[i],
              priceDifference: priceDiff,
              potentialProfit: priceDiff * Math.min(assets[i].volume24h, assets[j].volume24h),
              confidence
            });
          }
        }
      }
    });
    
    // Sort by potential profit * confidence
    return opportunities
      .sort((a, b) => (b.potentialProfit * b.confidence) - (a.potentialProfit * a.confidence))
      .slice(0, 5); // Return top 5 opportunities
  }

  private calculateConfidence(asset1: Asset, asset2: Asset): number {
    // Simple confidence calculation based on volume and market cap
    const volumeRatio = Math.min(asset1.volume24h, asset2.volume24h) / 
                       Math.max(asset1.volume24h, asset2.volume24h);
    
    const marketCapRatio = Math.min(asset1.marketCap, asset2.marketCap) /
                          Math.max(asset1.marketCap, asset2.marketCap);
    
    return (volumeRatio * 0.7) + (marketCapRatio * 0.3); // Weighted average
  }

  private generateMarketSummary(assets: Asset[]): string {
    const totalAssets = assets.length;
    const avgPriceChange = assets.reduce((sum, asset) => sum + asset.priceChange24h, 0) / totalAssets;
    
    return `Market Summary: Analyzing ${totalAssets} assets. ` +
           `Average 24h price change: ${avgPriceChange.toFixed(2)}%. ` +
           `Market sentiment: ${avgPriceChange > 0 ? 'Bullish' : 'Bearish'}`;
  }
} 