import { Brain, TrendingUp, Shield, Zap } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Brain className="w-12 h-12 mb-4 text-arbisent-primary" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze market data and social sentiment to identify profitable opportunities."
    },
    {
      icon: <TrendingUp className="w-12 h-12 mb-4 text-arbisent-primary" />,
      title: "Real-Time Monitoring",
      description: "Continuous monitoring of price discrepancies across multiple DEXs with instant execution capabilities."
    },
    {
      icon: <Shield className="w-12 h-12 mb-4 text-arbisent-primary" />,
      title: "Smart Contract Security",
      description: "Built-in safeguards and escrow mechanisms ensure secure, transparent trading execution."
    },
    {
      icon: <Zap className="w-12 h-12 mb-4 text-arbisent-primary" />,
      title: "Lightning Fast Execution",
      description: "High-performance architecture enables rapid response to market opportunities with minimal latency."
    }
  ];

  return (
    <section id="features" className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            Powerful Features for
            <span className="text-arbisent-primary"> Smart Trading</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            Leverage cutting-edge technology to capitalize on market inefficiencies across decentralized exchanges.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg bg-black/20 backdrop-blur-sm border border-arbisent-text/10 hover:border-arbisent-primary/50 transition-colors"
            >
              <div className="flex flex-col items-center text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold text-arbisent-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-arbisent-text/70">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;