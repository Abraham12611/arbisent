export interface EmailPreferences {
  marketing: boolean;
  trade_alerts: boolean;
  security_notifications: boolean;
  [key: string]: boolean;
}

export interface WalletAddress {
  address: string;
  isDefault: boolean;
  [key: string]: string | boolean;
}

export interface WalletAddresses {
  [key: string]: WalletAddress | undefined;
}

export interface PrivacySettings {
  share_trading_analytics: boolean;
  collect_usage_data: boolean;
  public_profile: boolean;
  [key: string]: boolean;
}

export interface TradingPreferences {
  default_pairs: string[];
  risk_management: {
    default_stop_loss_percentage: number;
    default_take_profit_percentage: number;
    max_position_size_usd: number;
    [key: string]: number;
  };
  interface_preferences: {
    chart_type: string;
    default_timeframe: string;
    layout: string;
    [key: string]: string;
  };
  [key: string]: any;
}

export interface ProfileFormValues {
  username: string;
  avatar_url: string;
  email_preferences: EmailPreferences;
  [key: string]: string | EmailPreferences;
}