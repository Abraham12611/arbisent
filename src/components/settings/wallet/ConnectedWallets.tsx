
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WalletCards } from "lucide-react";
import { WalletConnector } from "@/components/WalletConnector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WalletService } from "@/services/wallet";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAddress, WalletAddresses } from "@/types/preferences";
import { NotificationSettings } from "./NotificationSettings";
import { WalletCard } from "./WalletCard";

interface WalletStatus {
  balance: string;
  isValid: boolean;
  lastChecked: Date;
}

export function ConnectedWallets() {
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<WalletAddresses>({});
  const [notifications, setNotifications] = useState({
    onConnect: true,
    onDisconnect: true,
    lowBalance: true,
  });
  const [loading, setLoading] = useState(true);
  const { publicKey, connected } = useWallet();
  const [isChecking, setIsChecking] = useState(false);
  const [walletStatus, setWalletStatus] = useState<{
    [key: string]: WalletStatus
  }>({});

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsChecking(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_addresses')
        .eq('id', user.id)
        .single();

      if (profile?.wallet_addresses) {
        const addresses = profile.wallet_addresses as WalletAddresses;
        setWalletAddresses(addresses);

        const status: typeof walletStatus = {};
        for (const [type, wallet] of Object.entries(addresses)) {
          if (wallet) {
            const isValid = await WalletService.validateWallet(wallet.address, wallet.chain);
            const balance = await WalletService.getWalletBalance(wallet.address, wallet.chain);
            status[type] = {
              balance,
              isValid,
              lastChecked: new Date()
            };
          }
        }
        setWalletStatus(status);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  };

  const removeWallet = async (type: 'phantom' | 'metamask') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedAddresses = { ...walletAddresses };
      delete updatedAddresses[type];

      const result = await WalletService.updateWalletAddresses(user.id, updatedAddresses);
      if (!result.success) throw new Error(result.error);

      setWalletAddresses(updatedAddresses);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} wallet removed`);
    } catch (error: any) {
      console.error('Error removing wallet:', error);
      toast.error(error.message || 'Failed to remove wallet');
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

      const result = await WalletService.updateWalletAddresses(user.id, updatedAddresses);
      if (!result.success) throw new Error(result.error);

      setWalletAddresses(updatedAddresses);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} set as default wallet`);
    } catch (error: any) {
      console.error('Error setting default wallet:', error);
      toast.error('Failed to set default wallet');
    }
  };

  const toggleNotification = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  useEffect(() => {
    if (connected && publicKey && !walletAddresses.phantom) {
      const autoConnectPhantom = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const updatedAddresses = {
            ...walletAddresses,
            phantom: {
              address: publicKey.toString(),
              isDefault: true,
              chain: 'solana' as const,
              lastUsed: new Date()
            }
          };

          const result = await WalletService.updateWalletAddresses(user.id, updatedAddresses);
          if (!result.success) throw new Error(result.error);

          setWalletAddresses(updatedAddresses);
          toast.success('Phantom wallet connected automatically');
        } catch (error: any) {
          console.error('Error auto-connecting Phantom wallet:', error);
          toast.error(error.message || 'Failed to auto-connect wallet');
        }
      };

      autoConnectPhantom();
    }
  }, [connected, publicKey]);

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
              <WalletCard
                key={type}
                type={type}
                data={data as WalletAddress}
                balance={walletStatus[type]?.balance || '0'}
                isValid={walletStatus[type]?.isValid || false}
                onSetDefault={() => setDefaultWallet(type as 'phantom' | 'metamask')}
                onRemove={() => removeWallet(type as 'phantom' | 'metamask')}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <NotificationSettings 
        notifications={notifications}
        onToggle={toggleNotification}
      />

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
