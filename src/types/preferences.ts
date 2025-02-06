import { Json } from "@/integrations/supabase/types";

export interface WalletAddress {
  address: string;
  label?: string;
  isDefault: boolean;
}

export interface JsonWalletAddress extends Json {
  address: string;
  label?: string;
  isDefault: boolean;
}

export interface WalletAddresses {
  phantom?: JsonWalletAddress;
  metamask?: JsonWalletAddress;
}

export interface EmailPreferences {
  marketing: boolean;
  trade_alerts: boolean;
  security_notifications: boolean;
}

export interface TradingPreferences {
  [key: string]: string | number | boolean | Json | Json[];
  default_pairs: string[];
  risk_management: {
    default_stop_loss_percentage: number;
    default_take_profit_percentage: number;
    max_position_size_usd: number;
  };
  interface_preferences: {
    chart_type: string;
    default_timeframe: string;
    layout: string;
  };
}

export interface PrivacySettings {
  share_trading_analytics: boolean;
  collect_usage_data: boolean;
  public_profile: boolean;
}

export interface ProfileFormValues {
  username?: string;
  avatar_url?: string;
  email_preferences?: EmailPreferences;
  trading_preferences?: TradingPreferences;
  privacy_settings?: PrivacySettings;
  wallet_addresses?: WalletAddresses;
}