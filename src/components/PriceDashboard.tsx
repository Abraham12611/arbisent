import { CoinList } from "./price-dashboard/CoinList";

export const PriceDashboard = () => {
  return (
    <section className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            Live Market
            <span className="text-arbisent-primary"> Overview</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            Real-time cryptocurrency prices and market data from top exchanges.
          </p>
        </div>
        <CoinList />
      </div>
    </section>
  );
};