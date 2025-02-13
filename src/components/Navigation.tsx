import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
              {user ? (
                <>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-arbisent-accent text-arbisent-text px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-arbisent-text hover:text-arbisent-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/crossmint-auth")}
                  className="bg-arbisent-accent text-arbisent-text px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  Launch App
                </button>
              )}
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
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full text-left bg-arbisent-accent text-arbisent-text px-3 py-2 rounded-md text-base font-medium hover:bg-opacity-90"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-arbisent-text hover:text-arbisent-primary block px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="w-full text-left bg-arbisent-accent text-arbisent-text px-3 py-2 rounded-md text-base font-medium hover:bg-opacity-90"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;