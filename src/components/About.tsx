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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-arbisent-primary/10 rounded-lg">
                  <Brain className="w-6 h-6 text-arbisent-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-arbisent-text mb-2">AI-Powered Analysis</h3>
                  <p className="text-arbisent-text/70">
                    Advanced machine learning algorithms process market data and social sentiment in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-arbisent-primary/10 rounded-lg">
                  <LineChart className="w-6 h-6 text-arbisent-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-arbisent-text mb-2">Market Analysis</h3>
                  <p className="text-arbisent-text/70">
                    Continuous monitoring of price discrepancies across multiple DEXs for optimal opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-arbisent-primary/10 rounded-lg">
                  <Zap className="w-6 h-6 text-arbisent-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-arbisent-text mb-2">Lightning Fast</h3>
                  <p className="text-arbisent-text/70">
                    High-performance architecture enables rapid response to market opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-arbisent-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-arbisent-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-arbisent-text mb-2">Secure Trading</h3>
                  <p className="text-arbisent-text/70">
                    Built-in smart contract safeguards ensure secure and transparent trading execution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-arbisent-primary/20 to-arbisent-accent/20 p-1">
              <div className="w-full h-full rounded-xl bg-black/40 backdrop-blur-sm border border-arbisent-text/10 flex items-center justify-center">
                <div className="text-center p-8">
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
      </div>
    </section>
  );
};

export default About;