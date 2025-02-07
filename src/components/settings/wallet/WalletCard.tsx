
import { Button } from "@/components/ui/button";
import { WalletAddress } from "@/types/preferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2 } from "lucide-react";

interface WalletCardProps {
  type: string;
  data: WalletAddress;
  balance: string;
  isValid: boolean;
  onSetDefault: () => void;
  onRemove: () => void;
}

export function WalletCard({ 
  type, 
  data, 
  balance, 
  isValid, 
  onSetDefault, 
  onRemove 
}: WalletCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <img 
          src={`/${type}-icon.svg`} 
          alt={type} 
          className="w-8 h-8"
        />
        <div>
          <p className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
          <p className="text-sm text-muted-foreground">
            {data.address.slice(0, 6)}...{data.address.slice(-4)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant={data.isDefault ? "default" : "outline"}
          size="sm"
          onClick={onSetDefault}
        >
          {data.isDefault ? "Default" : "Set Default"}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Balance: {balance} {type === 'phantom' ? 'SOL' : 'ETH'}
        </p>
        {!isValid && (
          <Alert variant="destructive">
            <AlertDescription>
              This wallet address appears to be invalid
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
