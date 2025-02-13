import { supabase } from '@/integrations/supabase/client';
import { SolanaAuth } from '@crossmint/solana-auth-base';
import jwt from 'jsonwebtoken';

export const AUTH_DOMAIN = process.env.NEXT_PUBLIC_AUTH_DOMAIN || 'your-domain.com';

interface AuthAttempt {
  nonce: string;
  ttl: number;
  pubkey: string;
}

class SolanaAuthService {
  private auth: ReturnType<typeof SolanaAuth>;

  constructor() {
    this.auth = SolanaAuth({
      adapter: this.createAdapter(),
      authDomain: AUTH_DOMAIN
    });
  }

  private createAdapter() {
    return {
      async saveSigninAttempt(attempt: AuthAttempt) {
        const { data, error } = await supabase
          .from('auth_attempts')
          .upsert([attempt])
          .single();
        
        if (error) throw error;
        return data;
      },

      async getNonce(pubkey: string) {
        const { data, error } = await supabase
          .from('auth_attempts')
          .select('nonce')
          .eq('pubkey', pubkey)
          .single();
        
        if (error) throw error;
        return data?.nonce;
      },

      async generateToken(pubkey: string) {
        const token = jwt.sign(
          { sub: pubkey, iss: AUTH_DOMAIN },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        );
        return token;
      },

      async getTTL(pubkey: string) {
        const { data, error } = await supabase
          .from('auth_attempts')
          .select('ttl')
          .eq('pubkey', pubkey)
          .single();
        
        if (error) throw error;
        return data?.ttl || 300;
      }
    };
  }

  async createSignInAttempt(pubkey: string) {
    return this.auth.createSignInAttempt(pubkey);
  }

  async verifySignature(pubkey: string, nonce: string, signature: string) {
    return this.auth.verifySignature(pubkey, nonce, signature);
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return !!decoded;
    } catch {
      return false;
    }
  }

  async decodeToken(token: string) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    return decoded;
  }

  get adapter() {
    return this.auth.adapter;
  }
}

export const solanaAuth = new SolanaAuthService(); 