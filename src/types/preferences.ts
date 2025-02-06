export interface WalletAddress {
  address: string;
  label?: string;
  network?: string;
  type: 'phantom' | 'metamask';
  isDefault?: boolean;
}

export type WalletAddresses = {
  [key: string]: WalletAddress;
};

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

// Add Json type for Supabase compatibility
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Convert interfaces to Json-compatible types with index signatures
export interface JsonWalletAddress {
  [key: string]: Json;
  address: string;
  type: string;
  network?: string;
  label?: string;
  isDefault?: boolean;
}

export interface JsonWalletAddresses {
  [key: string]: JsonWalletAddress;
}

export interface JsonEmailPreferences {
  [key: string]: Json;
  marketing: boolean;
  trade_alerts: boolean;
  security_notifications: boolean;
}

export interface JsonTradingPreferences {
  [key: string]: Json;
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

export interface JsonPrivacySettings {
  [key: string]: Json;
  share_trading_analytics: boolean;
  collect_usage_data: boolean;
  public_profile: boolean;
}