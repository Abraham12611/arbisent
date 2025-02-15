import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Loader2 } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading = false,
  disabled = false 
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your trade (e.g., 'Buy 1 SOL at market price')"
        className="min-h-[80px]"
        disabled={disabled}
      />
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || disabled}
        className="px-3"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Send className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
} 