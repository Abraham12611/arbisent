import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, TrendingUp, AlertCircle, BarChart } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KPIMetrics } from "@/components/KPIMetrics";
import { PriceDashboard } from "@/components/PriceDashboard";

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
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-arbisent-text">Overview</h1>
        <p className="text-arbisent-text/70 mt-2">Monitor and manage your arbitrage opportunities</p>
      </div>

      <KPIMetrics />

      <PriceDashboard />
    </DashboardLayout>
  );
};

export default Dashboard;