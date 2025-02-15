import { Asset, AssetType } from "@/types/price-dashboard";
import { PriceService } from "@/services/price/price.service";
import { CoinGeckoService } from "@/services/price/coingecko.service";
import { CMCService } from "@/services/price/cmc.service";
import { DexPriceService } from "@/services/price/dex.service";
import { formatPrice, formatNumber } from "@/lib/utils";

interface ArbitrageOpportunity {
  sourceAsset: Asset;
  targetAsset: Asset;
  priceDifference: number;
  potentialProfit: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MarketTrend {
  type: AssetType;
  avgPriceChange: number;
  topGainer: Asset;
  topLoser: Asset;
  totalVolume: number;
}

export class MarketAnalysisService {
  private priceService: PriceService;
  private readonly MIN_CONFIDENCE = 0.6; // 60% minimum confidence
  private readonly MIN_PRICE_DEVIATION = 0.01; // 1% minimum price difference

  constructor() {
    this.priceService = new PriceService();

    // Register CoinGecko service (works with or without API key)
    const coingeckoApiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    try {
      this.priceService.registerService(new CoinGeckoService(coingeckoApiKey));
    } catch (error) {
      console.error('Failed to initialize CoinGecko service:', error);
    }

    // Try to register CMC service if API key is available
    const cmcApiKey = import.meta.env.VITE_CMC_API_KEY;
    if (cmcApiKey) {
      try {
        this.priceService.registerService(new CMCService(cmcApiKey));
      } catch (error) {
        console.error('Failed to initialize CMC service:', error);
      }
    }

    // Try to register DEX service if API key is available
    const etherscanApiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (etherscanApiKey) {
      try {
        this.priceService.registerService(new DexPriceService(etherscanApiKey));
      } catch (error) {
        console.error('Failed to initialize DEX service:', error);
      }
    }

    // Log registered services count
    console.log(`Initialized MarketAnalysisService with ${this.priceService.getServiceCount()} price services`);
  }

  async analyzeMarket(): Promise<{
    insights: string[];
    trendData: { type: AssetType; avgPriceChange: number; totalVolume: number; }[];
    opportunities: {
      symbol: string;
      profitPercentage: number;
      buyFrom: { source: string; price: number; };
      sellAt: { source: string; price: number; };
      estimatedProfit: number;
      confidence: number;
      risk: 'LOW' | 'MEDIUM' | 'HIGH';
    }[];
  }> {
    const insights: string[] = [];
    const trendData: { type: AssetType; avgPriceChange: number; totalVolume: number; }[] = [];
    const opportunities: {
      symbol: string;
      profitPercentage: number;
      buyFrom: { source: string; price: number; };
      sellAt: { source: string; price: number; };
      estimatedProfit: number;
      confidence: number;
      risk: 'LOW' | 'MEDIUM' | 'HIGH';
    }[] = [];
    
    try {
      // Get assets from all sources
      const assets = await this.priceService.getAssets([
        AssetType.CRYPTO,
        AssetType.TOKEN,
        AssetType.MEMECOIN
      ]);

      // Analyze market trends
      const trends = this.analyzeTrends(assets);
      insights.push(this.formatTrendInsights(trends));

      // Convert trends to chart data
      trends.forEach((trend, type) => {
        trendData.push({
          type,
          avgPriceChange: trend.avgPriceChange,
          totalVolume: trend.totalVolume
        });
      });

      // Group assets by symbol for comparison
      const assetsBySymbol = this.groupAssetsBySymbol(assets);
      
      // Find arbitrage opportunities
      const arbitrageOpps = this.findArbitrageOpportunities(assetsBySymbol);
      
      // Generate arbitrage insights and opportunities
      if (arbitrageOpps.length === 0) {
        insights.push("🔍 No significant arbitrage opportunities found at the moment.");
      } else {
        insights.push(`\n💡 Found ${arbitrageOpps.length} potential arbitrage opportunities:`);
        
        arbitrageOpps.forEach(opp => {
          const profitPercentage = (opp.priceDifference / opp.sourceAsset.price) * 100;
          const riskEmoji = this.getRiskEmoji(opp.riskLevel);
          
          // Add to insights
          insights.push(
            `${riskEmoji} ${opp.sourceAsset.symbol}: ${profitPercentage.toFixed(2)}% potential profit\n` +
            `   • Buy from: ${opp.sourceAsset.source} at ${formatPrice(opp.sourceAsset.price)}\n` +
            `   • Sell on: ${opp.targetAsset.source} at ${formatPrice(opp.targetAsset.price)}\n` +
            `   • Estimated profit: ${formatPrice(opp.potentialProfit)}\n` +
            `   • Confidence: ${(opp.confidence * 100).toFixed(0)}% | Risk: ${opp.riskLevel}`
          );

          // Add to opportunities
          opportunities.push({
            symbol: opp.sourceAsset.symbol,
            profitPercentage,
            buyFrom: {
              source: opp.sourceAsset.source,
              price: opp.sourceAsset.price
            },
            sellAt: {
              source: opp.targetAsset.source,
              price: opp.targetAsset.price
            },
            estimatedProfit: opp.potentialProfit,
            confidence: opp.confidence,
            risk: opp.riskLevel
          });
        });
      }

      // Add volume analysis
      insights.push(this.generateVolumeAnalysis(assets));

      // Add market summary
      insights.push(this.generateMarketSummary(assets));

    } catch (error) {
      console.error('Market analysis error:', error);
      insights.push('❌ Error analyzing market data. Please try again.');
    }

    return { insights, trendData, opportunities };
  }

  private analyzeTrends(assets: Asset[]): Map<AssetType, MarketTrend> {
    const trends = new Map<AssetType, MarketTrend>();
    
    Object.values(AssetType).forEach(type => {
      const typeAssets = assets.filter(asset => asset.type === type);
      if (typeAssets.length === 0) return;

      const avgPriceChange = typeAssets.reduce((sum, asset) => sum + asset.priceChange24h, 0) / typeAssets.length;
      const topGainer = typeAssets.reduce((prev, curr) => prev.priceChange24h > curr.priceChange24h ? prev : curr);
      const topLoser = typeAssets.reduce((prev, curr) => prev.priceChange24h < curr.priceChange24h ? prev : curr);
      const totalVolume = typeAssets.reduce((sum, asset) => sum + asset.volume24h, 0);

      trends.set(type, {
        type,
        avgPriceChange,
        topGainer,
        topLoser,
        totalVolume
      });
    });

    return trends;
  }

  private formatTrendInsights(trends: Map<AssetType, MarketTrend>): string {
    let insight = "📊 Market Trends (24h):\n";
    
    trends.forEach(trend => {
      const sentiment = trend.avgPriceChange >= 0 ? '📈' : '📉';
      insight += `\n${sentiment} ${trend.type}:\n`;
      insight += `   • Average Change: ${trend.avgPriceChange.toFixed(2)}%\n`;
      insight += `   • Top Gainer: ${trend.topGainer.symbol} (${trend.topGainer.priceChange24h.toFixed(2)}%)\n`;
      insight += `   • Top Loser: ${trend.topLoser.symbol} (${trend.topLoser.priceChange24h.toFixed(2)}%)\n`;
      insight += `   • Total Volume: ${formatNumber(trend.totalVolume)}`;
    });

    return insight;
  }

  private findArbitrageOpportunities(assetsBySymbol: Map<string, Asset[]>): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    assetsBySymbol.forEach(assets => {
      if (assets.length < 2) return;
      
      for (let i = 0; i < assets.length; i++) {
        for (let j = i + 1; j < assets.length; j++) {
          const priceDiff = Math.abs(assets[i].price - assets[j].price);
          const avgPrice = (assets[i].price + assets[j].price) / 2;
          const priceDeviation = priceDiff / avgPrice;
          
          if (priceDeviation > this.MIN_PRICE_DEVIATION) {
            const confidence = this.calculateConfidence(assets[i], assets[j]);
            
            if (confidence >= this.MIN_CONFIDENCE) {
              const riskLevel = this.calculateRiskLevel(assets[i], assets[j], priceDeviation);
              
              opportunities.push({
                sourceAsset: assets[i].price < assets[j].price ? assets[i] : assets[j],
                targetAsset: assets[i].price < assets[j].price ? assets[j] : assets[i],
                priceDifference: priceDiff,
                potentialProfit: priceDiff * Math.min(assets[i].volume24h, assets[j].volume24h),
                confidence,
                riskLevel
              });
            }
          }
        }
      }
    });
    
    return opportunities
      .sort((a, b) => (b.potentialProfit * b.confidence) - (a.potentialProfit * a.confidence))
      .slice(0, 5);
  }

  private calculateRiskLevel(asset1: Asset, asset2: Asset, priceDeviation: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const volumeRatio = Math.min(asset1.volume24h, asset2.volume24h) / 
                       Math.max(asset1.volume24h, asset2.volume24h);
    
    if (volumeRatio > 0.7 && priceDeviation < 0.03) return 'LOW';
    if (volumeRatio > 0.3 && priceDeviation < 0.05) return 'MEDIUM';
    return 'HIGH';
  }

  private getRiskEmoji(risk: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (risk) {
      case 'LOW': return '🟢';
      case 'MEDIUM': return '🟡';
      case 'HIGH': return '🔴';
    }
  }

  private generateVolumeAnalysis(assets: Asset[]): string {
    const totalVolume = assets.reduce((sum, asset) => sum + asset.volume24h, 0);
    const avgVolume = totalVolume / assets.length;
    const highVolumeAssets = assets.filter(asset => asset.volume24h > avgVolume * 2);
    
    return `\n📈 Volume Analysis:\n` +
           `   • Total Market Volume: ${formatNumber(totalVolume)}\n` +
           `   • Average Asset Volume: ${formatNumber(avgVolume)}\n` +
           `   • High Volume Assets: ${highVolumeAssets.length} assets trading above 2x average volume`;
  }

  private generateMarketSummary(assets: Asset[]): string {
    const totalAssets = assets.length;
    const avgPriceChange = assets.reduce((sum, asset) => sum + asset.priceChange24h, 0) / totalAssets;
    const sentiment = avgPriceChange >= 2 ? '🚀 Very Bullish' : 
                     avgPriceChange > 0 ? '📈 Bullish' :
                     avgPriceChange > -2 ? '📉 Bearish' : '🔻 Very Bearish';
    
    return `\n📊 Market Summary:\n` +
           `   • Analyzing ${totalAssets} assets\n` +
           `   • Average 24h Change: ${avgPriceChange.toFixed(2)}%\n` +
           `   • Market Sentiment: ${sentiment}`;
  }

  private calculateConfidence(asset1: Asset, asset2: Asset): number {
    // Calculate confidence based on volume and market cap
    const volumeRatio = Math.min(asset1.volume24h, asset2.volume24h) / 
                       Math.max(asset1.volume24h, asset2.volume24h);
    
    const marketCapRatio = Math.min(asset1.marketCap, asset2.marketCap) /
                          Math.max(asset1.marketCap, asset2.marketCap);
    
    return (volumeRatio * 0.7) + (marketCapRatio * 0.3); // Weighted average
  }

  private groupAssetsBySymbol(assets: Asset[]): Map<string, Asset[]> {
    const grouped = new Map<string, Asset[]>();
    
    assets.forEach(asset => {
      const existing = grouped.get(asset.symbol) || [];
      grouped.set(asset.symbol, [...existing, asset]);
    });
    
    return grouped;
  }
} 