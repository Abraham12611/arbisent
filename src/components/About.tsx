import { LineChart, Zap, Shield, Brain } from "lucide-react";

const About = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-arbisent-text mb-4">
            About <span className="text-arbisent-primary">ArbiSent</span>
          </h2>
          <p className="text-lg text-arbisent-text/80 max-w-2xl mx-auto">
            An AI-powered arbitrage bot that leverages real-time market data and social sentiment analysis to identify and execute profitable trading opportunities.
          </p>
        </div>

        {/* Grid Layout for Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* AI-Powered Analysis Card */}
          <div className="bg-[#0F1117]/80 backdrop-blur-sm rounded-xl p-8 border border-arbisent-text/10 hover:border-arbisent-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-arbisent-primary/10 rounded-lg">
                <Brain className="w-8 h-8 text-arbisent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-arbisent-text mb-3">AI-Powered Analysis</h3>
                <p className="text-arbisent-text/70">
                  Advanced machine learning algorithms process market data and social sentiment in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Market Analysis Card */}
          <div className="bg-[#0F1117]/80 backdrop-blur-sm rounded-xl p-8 border border-arbisent-text/10 hover:border-arbisent-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-arbisent-primary/10 rounded-lg">
                <LineChart className="w-8 h-8 text-arbisent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-arbisent-text mb-3">Market Analysis</h3>
                <p className="text-arbisent-text/70">
                  Continuous monitoring of price discrepancies across multiple DEXs for optimal opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* Lightning Fast Card */}
          <div className="bg-[#0F1117]/80 backdrop-blur-sm rounded-xl p-8 border border-arbisent-text/10 hover:border-arbisent-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-arbisent-primary/10 rounded-lg">
                <Zap className="w-8 h-8 text-arbisent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-arbisent-text mb-3">Lightning Fast</h3>
                <p className="text-arbisent-text/70">
                  High-performance architecture enables rapid response to market opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* Secure Trading Card */}
          <div className="bg-[#0F1117]/80 backdrop-blur-sm rounded-xl p-8 border border-arbisent-text/10 hover:border-arbisent-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-arbisent-primary/10 rounded-lg">
                <Shield className="w-8 h-8 text-arbisent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-arbisent-text mb-3">Secure Trading</h3>
                <p className="text-arbisent-text/70">
                  Built-in smart contract safeguards ensure secure and transparent trading execution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Start Section - Moved Below Grid */}
        <div className="mt-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0F1117]/80 backdrop-blur-sm rounded-xl p-8 border border-arbisent-text/10">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-arbisent-text mb-4">Ready to Start?</h3>
                <p className="text-arbisent-text/70 mb-6">
                  Join ArbiSent today and leverage the power of AI for smarter crypto arbitrage trading.
                </p>
                <button className="bg-arbisent-accent text-arbisent-text px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;