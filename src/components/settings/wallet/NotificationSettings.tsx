
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationSettings {
  onConnect: boolean;
  onDisconnect: boolean;
  lowBalance: boolean;
}

interface NotificationSettingsProps {
  notifications: NotificationSettings;
  onToggle: (type: keyof NotificationSettings) => void;
}

export function NotificationSettings({ notifications, onToggle }: NotificationSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Notifications</CardTitle>
        <CardDescription>Configure how you want to be notified about wallet activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">On Connect</div>
              <div className="text-sm text-muted-foreground">
                Receive notifications when a new wallet is connected
              </div>
            </div>
            <Switch
              checked={notifications.onConnect}
              onCheckedChange={() => onToggle('onConnect')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">On Disconnect</div>
              <div className="text-sm text-muted-foreground">
                Receive notifications when a wallet is disconnected
              </div>
            </div>
            <Switch
              checked={notifications.onDisconnect}
              onCheckedChange={() => onToggle('onDisconnect')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Low Balance</div>
              <div className="text-sm text-muted-foreground">
                Get notified when your wallet balance is running low
              </div>
            </div>
            <Switch
              checked={notifications.lowBalance}
              onCheckedChange={() => onToggle('lowBalance')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
