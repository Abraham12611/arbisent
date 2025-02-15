import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, TrendingUp } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const MessageInput = ({ value, onChange, onSubmit, isLoading }: MessageInputProps) => {
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your trade strategy..."
        className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none text-base resize-none"
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <Button 
          type="button"
          variant="ghost" 
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-transparent"
          disabled={isLoading}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Analysis
        </Button>
        <Button 
          onClick={onSubmit}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
          disabled={isLoading}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit
        </Button>
      </div>
    </div>
  );
};