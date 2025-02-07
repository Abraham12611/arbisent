
import { Json } from "@/integrations/supabase/types";

export interface WalletAddress {
  address: string;
  label?: string;
  isDefault: boolean;
  chain: 'solana' | 'ethereum';
  lastUsed?: Date;
  balance?: string;
}

export interface JsonWalletAddress extends Record<string, Json> {
  address: string;
  label?: string;
  isDefault: boolean;
  chain: 'solana' | 'ethereum';
  lastUsed?: string;
  balance?: string;
}

export interface JsonWalletAddresses {
  phantom?: JsonWalletAddress;
  metamask?: JsonWalletAddress;
}

export interface WalletAddresses {
  phantom?: WalletAddress;
  metamask?: WalletAddress;
}

export interface EmailPreferences {
  marketing: boolean;
  trade_alerts: boolean;
  security_notifications: boolean;
}

export interface JsonEmailPreferences extends Record<string, Json> {
  marketing: boolean;
  trade_alerts: boolean;
  security_notifications: boolean;
}

export interface TradingPreferences {
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

export interface JsonTradingPreferences {
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

export interface JsonPrivacySettings extends Record<string, Json> {
  share_trading_analytics: boolean;
  collect_usage_data: boolean;
  public_profile: boolean;
}

export interface ProfileFormValues {
  username?: string;
  avatar_url?: string;
  email_preferences?: JsonEmailPreferences;
  trading_preferences?: JsonTradingPreferences;
  privacy_settings?: JsonPrivacySettings;
  wallet_addresses?: JsonWalletAddresses;
}
