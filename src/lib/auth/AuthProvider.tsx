import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SolanaAuthProvider } from '@crossmint/solana-auth-react-ui';
import { solanaAuth, AUTH_DOMAIN } from './config';
import { toast } from 'sonner';

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
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const isValid = await solanaAuth.verifyToken(token);
          if (isValid) {
            const decoded = await solanaAuth.decodeToken(token);
            setUser({
              pubkey: decoded.sub,
              token
            });
            setIsAuthenticated(true);
          } else {
            await handleSignOut();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        await handleSignOut();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const result = await solanaAuth.signIn();
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        setUser({
          pubkey: result.pubkey,
          token: result.token
        });
        setIsAuthenticated(true);
        toast.success('Successfully connected wallet');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Successfully disconnected wallet');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to disconnect wallet');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      <SolanaAuthProvider
        authDomain={AUTH_DOMAIN}
        onAuthCallback={handleSignIn}
        signOut={handleSignOut}
      >
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