import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-black/20 backdrop-blur-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-arbisent-text">ArbiSent</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#features" className="text-arbisent-text hover:text-arbisent-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Features
              </a>
              <a href="#about" className="text-arbisent-text hover:text-arbisent-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </a>
              <button className="bg-arbisent-accent text-arbisent-text px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors">
                Launch App
              </button>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-arbisent-text hover:text-arbisent-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/20 backdrop-blur-lg">
            <a href="#features" className="text-arbisent-text hover:text-arbisent-primary block px-3 py-2 rounded-md text-base font-medium">
              Features
            </a>
            <a href="#about" className="text-arbisent-text hover:text-arbisent-primary block px-3 py-2 rounded-md text-base font-medium">
              About
            </a>
            <button className="w-full text-left bg-arbisent-accent text-arbisent-text px-3 py-2 rounded-md text-base font-medium hover:bg-opacity-90">
              Launch App
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;