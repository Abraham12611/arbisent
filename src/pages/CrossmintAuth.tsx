import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthProvider';
import { LoginButton } from '@/components/auth/LoginButton';
import { Loader2 } from 'lucide-react';

export function CrossmintAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-arbisent-primary/20 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-arbisent-text">
            Welcome to ArbiSent
          </h1>
          <p className="text-arbisent-text/70">
            Connect your wallet to start trading
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-arbisent-text" />
          </div>
        ) : (
          <div className="space-y-4">
            <LoginButton />
            <p className="text-sm text-arbisent-text/50">
              By connecting your wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 