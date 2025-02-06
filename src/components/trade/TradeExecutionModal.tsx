import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TradeOrderForm } from "./TradeOrderForm";
import { ChatHistory } from "./ChatHistory";
import { TradingContextCards } from "./TradingContextCards";
import { MessageInput } from "./MessageInput";

interface TradeExecutionModalProps {
  chatId?: string;
}

export const TradeExecutionModal = ({ chatId }: TradeExecutionModalProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
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

  const handleSubmit = async () => {
    if (!validateTradePrompt()) return;

    const formattedPrompt = formatTradePrompt();
    const userMessage = { role: 'user' as const, content: formattedPrompt };
    
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
      
      const aiMessage = { role: 'assistant' as const, content: data.answer };
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

      <ChatHistory messages={chatHistory} />

      <Card className="bg-[#151822]/80 border-gray-800">
        <CardContent className="p-4">
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

          <MessageInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {chatHistory.length === 0 && <TradingContextCards />}
    </div>
  );
};