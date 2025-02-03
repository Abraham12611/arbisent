import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-arbisent-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Section with Text and Floating Logos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Left side - Text Content */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-6xl font-bold text-arbisent-text mb-6 [text-shadow:_0_1px_3px_rgb(0_0_0_/_50%)]">
              AI-Powered Crypto
              <span className="text-arbisent-primary [text-shadow:_0_1px_5px_rgb(37_99_235_/_30%)]"> Arbitrage</span>
            </h1>
            <p className="text-xl sm:text-2xl text-arbisent-text/80 mb-12 [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)]">
              Exploit price discrepancies across DEXs with our advanced AI technology and real-time social sentiment analysis.
            </p>
          </div>

          {/* Right side - Floating Crypto Logos */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0">
              {/* Bitcoin */}
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <img src="/bitcoin.svg" alt="Bitcoin" className="w-full h-full object-contain" />
              </div>
              {/* Ethereum */}
              <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <img src="/ethereum.svg" alt="Ethereum" className="w-full h-full object-contain" />
              </div>
              {/* Binance */}
              <div className="absolute top-1/2 right-0 w-14 h-14 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <img src="/binance.svg" alt="Binance" className="w-full h-full object-contain" />
              </div>
              {/* Solana */}
              <div className="absolute bottom-0 right-1/4 w-18 h-18 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <img src="/solana.svg" alt="Solana" className="w-full h-full object-contain" />
              </div>
              {/* USDT */}
              <div className="absolute top-1/3 right-1/2 w-16 h-16 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <img src="/usdt.svg" alt="USDT" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Text Input Area (Kept in the same position) */}
        <div className="max-w-xl mx-auto">
          <div className="relative overflow-hidden rounded-lg p-[1px] bg-gradient-to-r from-arbisent-primary via-arbisent-accent to-arbisent-primary group">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
            </div>
            <div className="relative bg-black/40 backdrop-blur-sm rounded-lg p-8">
              <input
                type="text"
                placeholder="Enter your trading prompt... e.g., 'Find arbitrage opportunities on Solana'"
                className="w-full bg-transparent border-2 border-arbisent-text/20 rounded-lg px-4 py-3 text-arbisent-text placeholder-arbisent-text/50 focus:outline-none focus:border-arbisent-primary transition-colors"
              />
              <button className="mt-4 w-full sm:w-auto bg-arbisent-accent text-arbisent-text px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors inline-flex items-center justify-center gap-2 group">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;