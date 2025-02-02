import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, TrendingUp, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-arbisent-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-arbisent-text">ArbiSent Dashboard</h1>
          <p className="text-arbisent-text/70 mt-2">Monitor and manage your arbitrage opportunities</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10">
            <div className="flex items-center justify-between">
              <h3 className="text-arbisent-text font-medium">Active Opportunities</h3>
              <ArrowUpDown className="text-arbisent-accent" size={20} />
            </div>
            <p className="text-2xl font-bold text-arbisent-text mt-2">12</p>
          </div>
          
          <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10">
            <div className="flex items-center justify-between">
              <h3 className="text-arbisent-text font-medium">Total Profit (24h)</h3>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-arbisent-text mt-2">$1,234.56</p>
          </div>
          
          <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10">
            <div className="flex items-center justify-between">
              <h3 className="text-arbisent-text font-medium">Risk Level</h3>
              <AlertCircle className="text-yellow-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-arbisent-text mt-2">Medium</p>
          </div>
        </div>

        {/* Recent Opportunities Table */}
        <div className="bg-black/40 rounded-lg border border-arbisent-text/10 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-arbisent-text">Recent Opportunities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/70 uppercase tracking-wider">Pair</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/70 uppercase tracking-wider">DEX A</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/70 uppercase tracking-wider">DEX B</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/70 uppercase tracking-wider">Spread</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/70 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arbisent-text/10">
                <tr>
                  <td className="px-6 py-4 text-sm text-arbisent-text">SOL/USDC</td>
                  <td className="px-6 py-4 text-sm text-arbisent-text">Raydium</td>
                  <td className="px-6 py-4 text-sm text-arbisent-text">Orca</td>
                  <td className="px-6 py-4 text-sm text-green-500">2.3%</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-500">Active</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-arbisent-text">RAY/USDC</td>
                  <td className="px-6 py-4 text-sm text-arbisent-text">Serum</td>
                  <td className="px-6 py-4 text-sm text-arbisent-text">Raydium</td>
                  <td className="px-6 py-4 text-sm text-yellow-500">1.5%</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;