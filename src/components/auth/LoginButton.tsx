import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Loader2 } from 'lucide-react';

export function LoginButton() {
  const { signIn, signOut, isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Button
        onClick={signOut}
        variant="outline"
      >
        Disconnect {user.pubkey.slice(0, 4)}...{user.pubkey.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={signIn}>
      Connect Wallet
    </Button>
  );
} 