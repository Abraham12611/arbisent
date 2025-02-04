import { ArrowDown, ArrowUp } from "lucide-react";

interface CoinRowProps {
  coin: {
    name: string;
    symbol: string;
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
  };
}

export const CoinRow = ({ coin }: CoinRowProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <tr className="border-b border-arbisent-text/10">
      <td className="px-4 py-4">{coin.name}</td>
      <td className="px-4 py-4">{coin.symbol.toUpperCase()}</td>
      <td className="px-4 py-4">{formatNumber(coin.price)}</td>
      <td className="px-4 py-4">{formatNumber(coin.marketCap)}</td>
      <td className="px-4 py-4">{formatNumber(coin.volume24h)}</td>
      <td className="px-4 py-4">
        <span className={`flex items-center ${coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {coin.priceChange24h >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
          {formatPercentage(coin.priceChange24h)}
        </span>
      </td>
    </tr>
  );
};