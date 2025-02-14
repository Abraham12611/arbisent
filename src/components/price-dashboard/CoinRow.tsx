import { Asset } from "@/types/price-dashboard";
import { formatNumber, formatPrice } from "@/lib/utils";

interface CoinRowProps {
  asset: Asset;
}

export const CoinRow = ({ asset }: CoinRowProps) => {
  const priceChangeClass = asset.priceChange24h >= 0 ? "text-green-500" : "text-red-500";

  return (
    <tr className="border-b border-arbisent-border hover:bg-arbisent-hover/5">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm font-medium text-arbisent-text">{asset.name}</div>
            <div className="text-sm text-arbisent-text/60">{asset.symbol}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-arbisent-text">{formatPrice(asset.price)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm ${priceChangeClass}`}>
          {asset.priceChange24h.toFixed(2)}%
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-arbisent-text">
        {formatNumber(asset.marketCap)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-arbisent-text">
        {formatNumber(asset.volume24h)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-arbisent-text">
        <span className="px-2 py-1 text-xs font-medium rounded-full" 
              style={{ 
                backgroundColor: getTypeColor(asset.type),
                color: '#fff'
              }}>
          {asset.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-arbisent-text/60">
        {asset.source}
      </td>
    </tr>
  );
};

const getTypeColor = (type: Asset['type']) => {
  switch (type) {
    case 'CRYPTO':
      return '#2563eb'; // blue
    case 'TOKEN':
      return '#7c3aed'; // purple
    case 'MEMECOIN':
      return '#db2777'; // pink
    default:
      return '#6b7280'; // gray
  }
};