import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TradeExecutionModal = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { prompt: prompt.trim() }
      });

      if (error) throw error;
      
      setResponse(data.answer);
      toast.success("Response received!");
    } catch (error: any) {
      console.error('Error calling chat function:', error);
      toast.error(error.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto justify-center">
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <img 
          src="/lovable-uploads/998ad3dc-284b-4f48-b8db-74c80e24495a.png" 
          alt="Trade Bot" 
          className="w-16 h-16 mb-4"
        />
        <h1 className="text-3xl font-bold mb-2">
          How can <span className="text-yellow-500">We</span> help you?
        </h1>
        <p className="text-gray-400">
          Orchestrate a hive mind of DeFi Agents to act on Solana
        </p>
      </div>

      <Card className="bg-[#151822]/80 border-gray-800">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the hive anything..."
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none text-base py-6 pr-32 min-h-[120px] resize-none"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-transparent"
                disabled={isLoading}
              >
                Open AI
              </Button>
              <Button 
                type="submit"
                size="icon"
                className="bg-transparent hover:bg-white/10 text-white"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {response && (
        <Card className="mt-4 bg-[#151822]/50 border-gray-800">
          <CardContent className="p-4">
            <div className="text-gray-200 whitespace-pre-wrap">{response}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mt-8">
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-1 text-gray-400">Trending</h3>
            <p className="text-sm text-gray-500">Search the trending tokens</p>
          </CardContent>
        </Card>
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-1 text-gray-400">Stake</h3>
            <p className="text-sm text-gray-500">Stake Sol</p>
          </CardContent>
        </Card>
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-1 text-gray-400">Trade</h3>
            <p className="text-sm text-gray-500">Swap on Jupiter</p>
          </CardContent>
        </Card>
        <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-1 text-gray-400">Knowledge</h3>
            <p className="text-sm text-gray-500">Get developer docs for protocols</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};