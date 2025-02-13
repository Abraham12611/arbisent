import { supabase } from '@/integrations/supabase/client';
import { SolanaAuth, Adapter } from '@crossmint/solana-auth-base';
import jwt from 'jsonwebtoken';

export const AUTH_DOMAIN = process.env.NEXT_PUBLIC_AUTH_DOMAIN || 'your-domain.com';

// Custom database adapter for Crossmint auth
const authAdapter = (): Adapter => ({
  async saveSigninAttempt(attempt: { nonce: string; ttl: number; pubkey: string }) {
    // Store sign-in attempt in your database
    const { data, error } = await supabase
      .from('auth_attempts')
      .upsert([attempt])
      .single();
    
    if (error) throw error;
    return data;
  },

  async getNonce(pubkey: string) {
    // Get nonce from database
    const { data, error } = await supabase
      .from('auth_attempts')
      .select('nonce')
      .eq('pubkey', pubkey)
      .single();
    
    if (error) throw error;
    return data?.nonce;
  },

  async generateToken(pubkey: string) {
    // Generate JWT token
    const token = jwt.sign(
      { sub: pubkey, iss: AUTH_DOMAIN },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    return token;
  },

  async getTTL(pubkey: string) {
    // Get TTL from database
    const { data, error } = await supabase
      .from('auth_attempts')
      .select('ttl')
      .eq('pubkey', pubkey)
      .single();
    
    if (error) throw error;
    return data?.ttl || 300; // 5 minutes default
  },

  // Required by the Adapter interface
  async getTLL(pubkey: string) {
    return this.getTTL(pubkey);
  }
});

// Initialize Solana Auth with our custom adapter
export const solanaAuth = SolanaAuth({
  adapter: authAdapter(),
  authDomain: AUTH_DOMAIN
}); 