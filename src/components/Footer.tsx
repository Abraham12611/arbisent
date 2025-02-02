import { Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black/80 backdrop-blur-sm py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-arbisent-text mb-4">ArbiSent</h3>
            <p className="text-arbisent-text/70">
              AI-powered crypto arbitrage platform leveraging real-time market data and social sentiment analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="text-lg font-semibold text-arbisent-text mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-arbisent-text/70 hover:text-arbisent-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="text-arbisent-text/70 hover:text-arbisent-primary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-arbisent-text/70 hover:text-arbisent-primary transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-semibold text-arbisent-text mb-4">Connect With Us</h4>
            <div className="flex justify-center md:justify-end space-x-4">
              <a
                href="#"
                className="p-2 rounded-full bg-arbisent-primary/10 hover:bg-arbisent-primary/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-arbisent-text" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-arbisent-primary/10 hover:bg-arbisent-primary/20 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-arbisent-text" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-arbisent-text/10 text-center">
          <p className="text-arbisent-text/70">
            © {new Date().getFullYear()} ArbiSent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;