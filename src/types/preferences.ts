export interface WalletAddress {
  address: string;
  label?: string;
  connected_at: string;
  type: 'phantom' | 'metamask';
  network: string;
  isDefault: boolean;
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

export interface PrivacySettings {
  share_trading_analytics: boolean;
  collect_usage_data: boolean;
  public_profile: boolean;
}

export interface ProfileFormValues {
  username: string;
  avatar_url?: string;
  email_preferences?: EmailPreferences;
  trading_preferences?: TradingPreferences;
  privacy_settings?: PrivacySettings;
  wallet_addresses?: WalletAddresses;
}

// Json types for Supabase compatibility
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface JsonWalletAddress extends WalletAddress {
  [key: string]: Json | undefined;
}

export interface JsonWalletAddresses {
  [key: string]: JsonWalletAddress | undefined;
}

export interface JsonEmailPreferences extends EmailPreferences {
  [key: string]: Json | undefined;
}

export interface JsonTradingPreferences extends Omit<TradingPreferences, 'risk_management' | 'interface_preferences'> {
  [key: string]: Json | {
    default_stop_loss_percentage: number;
    default_take_profit_percentage: number;
    max_position_size_usd: number;
  } | {
    chart_type: string;
    default_timeframe: string;
    layout: string;
  } | undefined;
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

export interface JsonPrivacySettings extends PrivacySettings {
  [key: string]: Json | undefined;
}