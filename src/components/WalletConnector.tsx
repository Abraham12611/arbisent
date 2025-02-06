import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { WalletAddresses, WalletAddress, JsonWalletAddresses } from "@/types/preferences";

interface WalletConnectorProps {
  onClose?: () => void;
}

export function WalletConnector({ onClose }: WalletConnectorProps) {
  const [connecting, setConnecting] = useState(false);

  const connectPhantom = async () => {
    try {
      setConnecting(true);
      if (!window.solana || !window.solana.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const response = await window.solana.connect();
      const walletAddress = response.publicKey.toString();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_addresses')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const walletAddresses = ((profile?.wallet_addresses || {}) as JsonWalletAddresses) as WalletAddresses;
      const isFirstWallet = Object.keys(walletAddresses).length === 0;
      
      const updatedWalletAddresses: WalletAddresses = {
        ...walletAddresses,
        phantom: {
          address: walletAddress,
          type: 'phantom',
          network: 'solana',
          isDefault: isFirstWallet
        }
      };

      const { error } = await supabase.from('profiles').update({
        wallet_addresses: updatedWalletAddresses as JsonWalletAddresses
      }).eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast.success('Phantom wallet connected successfully!');
      onClose?.();
    } catch (error: any) {
      console.error('Error connecting Phantom wallet:', error);
      toast.error(error.message || 'Failed to connect Phantom wallet');
    } finally {
      setConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      setConnecting(true);
      if (!window.ethereum) {
        window.open('https://metamask.io/', '_blank');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const walletAddress = accounts[0];

      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_addresses')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const walletAddresses = ((profile?.wallet_addresses || {}) as JsonWalletAddresses) as WalletAddresses;
      const isFirstWallet = Object.keys(walletAddresses).length === 0;

      const updatedWalletAddresses: WalletAddresses = {
        ...walletAddresses,
        metamask: {
          address: walletAddress,
          type: 'metamask',
          network: 'ethereum',
          isDefault: isFirstWallet
        }
      };

      const { error } = await supabase.from('profiles').update({
        wallet_addresses: updatedWalletAddresses as JsonWalletAddresses
      }).eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast.success('MetaMask wallet connected successfully!');
      onClose?.();
    } catch (error: any) {
      console.error('Error connecting MetaMask wallet:', error);
      toast.error(error.message || 'Failed to connect MetaMask wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Button
        onClick={connectPhantom}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2 bg-[#AB9FF2] hover:bg-[#9081DB] text-white"
      >
        <img src="/phantom-icon.svg" alt="Phantom" className="w-5 h-5" />
        Connect Phantom
      </Button>
      
      <Button
        onClick={connectMetaMask}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2 bg-[#F6851B] hover:bg-[#E2761B] text-white"
      >
        <img src="/metamask-icon.svg" alt="MetaMask" className="w-5 h-5" />
        Connect MetaMask
      </Button>
    </div>
  );
}