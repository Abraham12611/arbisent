
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JsonPrivacySettings, PrivacySettings } from "@/types/preferences";

export function PrivacySection() {
  const [settings, setSettings] = useState<PrivacySettings>({
    share_trading_analytics: false,
    collect_usage_data: true,
    public_profile: false,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("privacy_settings")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profile?.privacy_settings) {
        const privacySettings = profile.privacy_settings as JsonPrivacySettings;
        setSettings({
          share_trading_analytics: !!privacySettings.share_trading_analytics,
          collect_usage_data: !!privacySettings.collect_usage_data,
          public_profile: !!privacySettings.public_profile,
        });
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error);
    }
  };

  const updatePrivacySettings = async (key: keyof PrivacySettings, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const newSettings = { ...settings, [key]: value };
      
      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: newSettings as JsonPrivacySettings })
        .eq("id", user.id);

      if (error) throw error;

      setSettings(newSettings);
      toast.success("Privacy settings updated");
    } catch (error: any) {
      toast.error("Failed to update privacy settings");
      console.error("Privacy settings update error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Manage your privacy preferences and data sharing options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="share-analytics" className="flex flex-col space-y-1">
            <span>Share Trading Analytics</span>
            <span className="text-sm text-muted-foreground">
              Allow anonymous sharing of trading patterns for community insights
            </span>
          </Label>
          <Switch
            id="share-analytics"
            checked={settings.share_trading_analytics}
            onCheckedChange={(checked) => updatePrivacySettings("share_trading_analytics", checked)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="usage-data" className="flex flex-col space-y-1">
            <span>Usage Analytics</span>
            <span className="text-sm text-muted-foreground">
              Help improve ArbiSent by sharing anonymous usage data
            </span>
          </Label>
          <Switch
            id="usage-data"
            checked={settings.collect_usage_data}
            onCheckedChange={(checked) => updatePrivacySettings("collect_usage_data", checked)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="public-profile" className="flex flex-col space-y-1">
            <span>Public Profile</span>
            <span className="text-sm text-muted-foreground">
              Make your trading profile visible to other users
            </span>
          </Label>
          <Switch
            id="public-profile"
            checked={settings.public_profile}
            onCheckedChange={(checked) => updatePrivacySettings("public_profile", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
