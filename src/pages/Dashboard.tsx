import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KPIMetrics } from "@/components/KPIMetrics";
import { PriceDashboard } from "@/components/PriceDashboard";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { ActivePositionsView } from "@/components/trades/ActivePositionsView";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");

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

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-arbisent-text">Overview</h1>
              <p className="text-arbisent-text/70 mt-2">Monitor and manage your arbitrage opportunities</p>
            </div>
            <KPIMetrics />
            <PriceDashboard />
          </>
        );
      case "trades":
        return <ActivePositionsView />;
      case "analytics":
        return <AnalyticsView />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout onViewChange={setActiveView}>
      {renderView()}
    </DashboardLayout>
  );
};

export default Dashboard;