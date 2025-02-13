import { supabase } from '@/integrations/supabase/client';

export interface AuthProfile {
  pubkey: string;
  username?: string;
  avatar_url?: string;
  email_preferences?: Record<string, any>;
  privacy_settings?: Record<string, any>;
  trading_preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class AuthDatabase {
  async createProfile(pubkey: string): Promise<AuthProfile> {
    const now = new Date().toISOString();
    const profile: Omit<AuthProfile, 'created_at' | 'updated_at'> = {
      pubkey,
      email_preferences: {},
      privacy_settings: {
        showTrades: true,
        showProfile: true
      },
      trading_preferences: {
        defaultSlippage: 0.5,
        autoConfirm: false
      }
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...profile, created_at: now, updated_at: now }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('pubkey', pubkey)
          .single();
        
        if (fetchError) throw fetchError;
        if (!existingProfile) throw new Error('Profile not found after unique violation');
        
        return existingProfile;
      }
      throw error;
    }

    return data;
  }

  async getProfile(pubkey: string): Promise<AuthProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('pubkey', pubkey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  async updateProfile(
    pubkey: string,
    updates: Partial<Omit<AuthProfile, 'pubkey' | 'created_at'>>
  ): Promise<AuthProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('pubkey', pubkey)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Profile not found');

    return data;
  }

  async deleteProfile(pubkey: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('pubkey', pubkey);

    if (error) throw error;
  }

  async migrateUserData(oldUserId: string, pubkey: string): Promise<void> {
    const { error: updateError } = await supabase.rpc('migrate_user_data', {
      old_user_id: oldUserId,
      new_pubkey: pubkey
    });

    if (updateError) throw updateError;
  }
} 