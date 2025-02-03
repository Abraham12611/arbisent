import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, WalletCards, Bell, Trash2 } from "lucide-react";
import { WalletConnector } from "@/components/WalletConnector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalletAddress {
  address: string;
  isDefault: boolean;
}

interface WalletAddresses {
  phantom?: WalletAddress;
  metamask?: WalletAddress;
}

interface NotificationSettings {
  onConnect: boolean;
  onDisconnect: boolean;
  lowBalance: boolean;
}

export function ConnectedWallets() {
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const [notifications, setNotifications] = useState<NotificationSettings>({
    onConnect: true,
    onDisconnect: true,
    lowBalance: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_addresses')
        .eq('id', user.id)
        .single();

      if (profile?.wallet_addresses) {
        setWalletAddresses(profile.wallet_addresses as WalletAddresses);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const removeWallet = async (type: 'phantom' | 'metamask') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedAddresses = { ...walletAddresses };
      delete updatedAddresses[type];

      const { error } = await supabase
        .from('profiles')
        .update({ wallet_addresses: updatedAddresses })
        .eq('id', user.id);

      if (error) throw error;

      setWalletAddresses(updatedAddresses);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} wallet removed`);
    } catch (error) {
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
    }
  };

  const setDefaultWallet = async (type: 'phantom' | 'metamask') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedAddresses = { ...walletAddresses };
      Object.keys(updatedAddresses).forEach(key => {
        if (updatedAddresses[key as keyof WalletAddresses]) {
          updatedAddresses[key as keyof WalletAddresses] = {
            ...updatedAddresses[key as keyof WalletAddresses]!,
            isDefault: key === type
          };
        }
      });

      const { error } = await supabase
        .from('profiles')
        .update({ wallet_addresses: updatedAddresses })
        .eq('id', user.id);

      if (error) throw error;

      setWalletAddresses(updatedAddresses);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} set as default wallet`);
    } catch (error) {
      console.error('Error setting default wallet:', error);
      toast.error('Failed to set default wallet');
    }
  };

  const toggleNotification = (type: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Wallets</CardTitle>
          <CardDescription>Manage your connected wallets and set default for transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => setShowWalletDialog(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <WalletCards className="h-4 w-4" />
              Connect New Wallet
            </Button>

            {Object.entries(walletAddresses).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={`/${type}-icon.svg`} 
                    alt={type} 
                    className="w-8 h-8"
                  />
                  <div>
                    <p className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.address.slice(0, 6)}...{data.address.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant={data.isDefault ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDefaultWallet(type as 'phantom' | 'metamask')}
                  >
                    {data.isDefault ? "Default" : "Set Default"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeWallet(type as 'phantom' | 'metamask')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                onCheckedChange={() => toggleNotification('onConnect')}
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
                onCheckedChange={() => toggleNotification('onDisconnect')}
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
                onCheckedChange={() => toggleNotification('lowBalance')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Your Wallets</DialogTitle>
          </DialogHeader>
          <WalletConnector 
            onClose={() => {
              setShowWalletDialog(false);
              fetchWalletData();
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}