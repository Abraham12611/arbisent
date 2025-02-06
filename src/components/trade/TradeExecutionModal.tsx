import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Send, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TradeExecutionModalProps {
  chatId?: string;
}

export const TradeExecutionModal = ({ chatId }: TradeExecutionModalProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);
  const [tradingPair, setTradingPair] = useState<string>("SOL/USDC");
  const [tradeType, setTradeType] = useState<string>("market");

  useEffect(() => {
    if (chatId) {
      loadChatHistory(chatId);
    }
  }, [chatId]);

  const loadChatHistory = async (id: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messages) {
        setChatHistory(messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })));
      }
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      toast.error("Failed to load chat history");
    }
  };

  const formatTradePrompt = () => {
    return `${tradeType.toUpperCase()} trade for ${tradingPair}: ${prompt}`;
  };

  const validateTradePrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a trade description");
      return false;
    }
    if (!tradingPair) {
      toast.error("Please select a trading pair");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTradePrompt()) return;

    const formattedPrompt = formatTradePrompt();
    const userMessage: ChatMessage = { role: 'user', content: formattedPrompt };
    
    try {
      setIsLoading(true);
      console.log("Submitting trade prompt:", formattedPrompt);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      if (!currentChatId) {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert([{ 
            title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
            user_id: user.id
          }])
          .select()
          .single();

        if (chatError) throw chatError;
        if (!chat) throw new Error("Failed to create chat");
        
        setCurrentChatId(chat.id);
      }

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_id: currentChatId,
          role: 'user',
          content: formattedPrompt
        }]);

      if (messageError) throw messageError;

      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          prompt: formattedPrompt,
          chatHistory: updatedHistory.slice(-10),
          tradeContext: {
            pair: tradingPair,
            type: tradeType
          }
        }
      });

      if (error) throw error;
      
      const aiMessage: ChatMessage = { role: 'assistant', content: data.answer };
      await supabase
        .from('chat_messages')
        .insert([{
          chat_id: currentChatId,
          role: 'assistant',
          content: data.answer
        }]);
      
      setChatHistory([...updatedHistory, aiMessage]);
      setPrompt("");
      toast.success("Trade analysis received!");
    } catch (error: any) {
      console.error('Error in trade execution:', error);
      toast.error(error.message || "Failed to process trade");
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
          Trade <span className="text-yellow-500">Assistant</span>
        </h1>
        <p className="text-gray-400">
          Analyze and execute trades with AI-powered insights
        </p>
      </div>

      {chatHistory.length > 0 && (
        <div className="mb-4 space-y-4 max-h-[400px] overflow-y-auto">
          {chatHistory.map((message, index) => (
            <Card key={index} className={`bg-[#151822]/${message.role === 'user' ? '80' : '50'} border-gray-800`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm text-gray-400">
                    {message.role === 'user' ? 'You:' : 'AI:'}
                  </span>
                  <div className="text-gray-200 whitespace-pre-wrap">{message.content}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-[#151822]/80 border-gray-800">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 mb-4">
              <Select value={tradingPair} onValueChange={setTradingPair}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL/USDC">SOL/USDC</SelectItem>
                  <SelectItem value="ETH/USDC">ETH/USDC</SelectItem>
                  <SelectItem value="BTC/USDC">BTC/USDC</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
                  type="submit"
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {chatHistory.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-400">Market Analysis</h3>
              </div>
              <p className="text-sm text-gray-500">Analyze current market conditions and trends</p>
            </CardContent>
          </Card>
          <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-400">Portfolio</h3>
              </div>
              <p className="text-sm text-gray-500">View and manage your active positions</p>
            </CardContent>
          </Card>
          <Card className="bg-[#151822]/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-400">Risk Analysis</h3>
              </div>
              <p className="text-sm text-gray-500">Evaluate potential risks and rewards</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};