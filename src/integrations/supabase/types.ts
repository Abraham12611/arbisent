export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      kpi_metrics: {
        Row: {
          active_opportunities: number | null
          created_at: string | null
          id: string
          risk_level: string | null
          success_rate: number | null
          total_profit_24h: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_opportunities?: number | null
          created_at?: string | null
          id?: string
          risk_level?: string | null
          success_rate?: number | null
          total_profit_24h?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_opportunities?: number | null
          created_at?: string | null
          id?: string
          risk_level?: string | null
          success_rate?: number | null
          total_profit_24h?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_preferences: Json | null
          id: string
          trading_preferences: Json | null
          updated_at: string
          username: string | null
          wallet_addresses: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_preferences?: Json | null
          id: string
          trading_preferences?: Json | null
          updated_at?: string
          username?: string | null
          wallet_addresses?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_preferences?: Json | null
          id?: string
          trading_preferences?: Json | null
          updated_at?: string
          username?: string | null
          wallet_addresses?: Json | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          pair_name: string
          profit_loss: number | null
          side: string
          status: string
          stop_loss: number | null
          take_profit: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          pair_name: string
          profit_loss?: number | null
          side: string
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          pair_name?: string
          profit_loss?: number | null
          side?: string
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      watched_pairs: {
        Row: {
          created_at: string
          dex_name: string
          id: string
          pair_address: string
          pair_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dex_name: string
          id?: string
          pair_address: string
          pair_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dex_name?: string
          id?: string
          pair_address?: string
          pair_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
