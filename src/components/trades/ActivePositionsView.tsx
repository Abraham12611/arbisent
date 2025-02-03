import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PositionTable } from "./PositionTable";
import { PositionControls } from "./PositionControls";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trade } from "@/types/trade";

export function ActivePositionsView() {
  const [positions, setPositions] = useState<Trade[]>([]);

  useEffect(() => {
    // Fetch initial active positions
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Failed to load active positions");
        console.error("Error fetching positions:", error);
        return;
      }

      setPositions(data || []);
    };

    fetchPositions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: 'status=eq.Open'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchPositions(); // Refresh positions on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <PositionControls />
          <PositionTable positions={positions} />
        </CardContent>
      </Card>
    </div>
  );
}