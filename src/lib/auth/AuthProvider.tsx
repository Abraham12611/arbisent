import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SolanaAuthProvider, useSolanaAuth } from '@crossmint/solana-auth-react-ui';
import { auth, AUTH_DOMAIN } from './config';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    pubkey: string;
    token: string;
  } | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, signIn, signOut } = useSolanaAuth();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token
          const isValid = await auth.verifyToken(token);
          if (!isValid) {
            await signOut();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        await signOut();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [signOut]);

  const value = {
    isAuthenticated,
    user,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      <SolanaAuthProvider domain={AUTH_DOMAIN}>
        {children}
      </SolanaAuthProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 