import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TradeOrderForm } from "./TradeOrderForm";
import { ChatHistory } from "./ChatHistory";
import { TradingContextCards } from "./TradingContextCards";
import { MessageInput } from "./MessageInput";
import { useTradeNLU } from "@/hooks/useTradeNLU";
import { Badge } from "@/components/ui/badge";
import { ParsedTradeMessage } from "@/lib/nlu/types";
import { TradeConfirmation } from "./TradeConfirmation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { processMessage, isProcessing, lastParsedMessage, errors } = useTradeNLU();

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

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a trade description");
      return;
    }

    try {
      setIsLoading(true);
      
      // Process message through NLU
      const parsedMessage = await processMessage(prompt);
      if (!parsedMessage) {
        // Display validation errors if any
        if (errors.length > 0) {
          errors.forEach(error => toast.error(error));
        }
        return;
      }

      // Show trade confirmation
      setShowConfirmation(true);
      
    } catch (error: any) {
      console.error('Error processing trade:', error);
      toast.error(error.message || "Failed to process trade");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTrade = async () => {
    if (!lastParsedMessage) return;

    try {
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

      // Store the original message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_id: currentChatId,
          role: 'user',
          content: prompt
        }]);

      if (messageError) throw messageError;

      const updatedHistory = [...chatHistory, { role: 'user' as const, content: prompt }];
      setChatHistory(updatedHistory);
      
      // Get AI response based on parsed intent
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          prompt,
          chatHistory: updatedHistory.slice(-10),
          parsedIntent: lastParsedMessage,
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
      setShowConfirmation(false);
      toast.success("Trade executed successfully!");
    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast.error(error.message || "Failed to execute trade");
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

      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {showConfirmation && lastParsedMessage ? (
        <TradeConfirmation
          trade={lastParsedMessage}
          onConfirm={handleConfirmTrade}
          onCancel={() => setShowConfirmation(false)}
        />
      ) : (
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
              isLoading={isLoading || isProcessing}
            />
          </CardContent>
        </Card>
      )}

      {chatHistory.length === 0 && <TradingContextCards />}
    </div>
  );
};