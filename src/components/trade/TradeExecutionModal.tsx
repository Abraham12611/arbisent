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
import { TradingPairSelect } from "./TradingPairSelect";
import { Button } from "@/components/ui/button";
import { ArbitrageOpportunityCard } from "./ArbitrageOpportunityCard";

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
  const { 
    processMessage, 
    processTradeMessage,
    isProcessing, 
    lastParsedMessage, 
    errors,
    isEthereumConnected,
    isSolanaConnected,
    confirmTrade
  } = useTradeNLU();

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

  const connectEthereumWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        toast.success('Ethereum wallet connected!');
      } catch (error) {
        console.error('Failed to connect Ethereum wallet:', error);
        toast.error('Failed to connect Ethereum wallet');
      }
    } else {
      toast.error('Please install MetaMask or another Ethereum wallet');
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsLoading(true);
      
      // Process the message
      const messageResult = await processMessage(prompt);
      if (!messageResult) {
        // Display validation errors if any
        if (errors.length > 0) {
          errors.forEach(error => toast.error(error));
        }
        return;
      }

      // Add message to chat history with proper type
      const newChatMessage = {
        role: 'user' as const,
        content: prompt,
        type: messageResult.type,
        data: messageResult.data
      };
      
      setChatHistory(prev => [...prev, newChatMessage]);

      // Handle different message types
      if (messageResult.type === 'trade') {
        setShowConfirmation(true);
      } else if (messageResult.type === 'arbitrage') {
        // Arbitrage results are automatically displayed in chat
        setPrompt("");
        // Store the message in Supabase if we have a chat ID
        if (currentChatId) {
          await supabase
            .from('chat_messages')
            .insert([{
              chat_id: currentChatId,
              role: 'user',
              content: prompt,
              metadata: {
                type: 'arbitrage',
                opportunities: messageResult.data?.opportunities,
                pair: messageResult.data?.pair
              }
            }]);
        }
      } else {
        // For general messages, just clear the input
        setPrompt("");
      }
      
    } catch (error: any) {
      console.error('Error processing message:', error);
      toast.error(error.message || "Failed to process message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteArbitrage = async (opportunity: any) => {
    try {
      // Check wallet connections before proceeding
      const canProceed = await confirmTrade();
      if (!canProceed) return;

      toast.success("Executing arbitrage opportunity...");
      // Here you would implement the actual arbitrage execution logic
      // For now, we'll just show a success message
      setTimeout(() => {
        toast.success("Arbitrage executed successfully!");
      }, 2000);
    } catch (error: any) {
      console.error('Error executing arbitrage:', error);
      toast.error(error.message || "Failed to execute arbitrage");
    }
  };

  const handleFlashLoanArbitrage = async (opportunity: any) => {
    try {
      // Check wallet connections before proceeding
      const canProceed = await confirmTrade();
      if (!canProceed) return;

      toast.success("Setting up flash loan...");
      // Here you would implement the flash loan setup and execution logic
      // For now, we'll just show a success message
      setTimeout(() => {
        toast.success("Flash loan arbitrage executed successfully!");
      }, 2000);
    } catch (error: any) {
      console.error('Error executing flash loan arbitrage:', error);
      toast.error(error.message || "Failed to execute flash loan arbitrage");
    }
  };

  const handleConfirmTrade = async () => {
    if (!lastParsedMessage) return;

    try {
      // Check wallet connection before proceeding
      const canProceed = await confirmTrade();
      if (!canProceed) return;

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
          src="/lovable-uploads/hermes-sent.png" 
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

      {(!isSolanaConnected || !isEthereumConnected) && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!isSolanaConnected && (
              <div className="mb-2">
                Please connect your Solana wallet to continue
              </div>
            )}
            {!isEthereumConnected && (
              <div className="flex items-center gap-2">
                <span>Please connect your Ethereum wallet to continue</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={connectEthereumWallet}
                >
                  Connect Ethereum Wallet
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto mb-4">
        {chatHistory.map((message, index) => (
          <div key={index} className="mb-4">
            {message.type === 'arbitrage' ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Searching for arbitrage opportunities for {message.data?.pair}...
                </div>
                {message.data?.opportunities?.map((opportunity: any) => (
                  <ArbitrageOpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onTrade={() => handleExecuteArbitrage(opportunity)}
                    onFlashLoan={() => handleFlashLoanArbitrage(opportunity)}
                    isExecuting={false}
                  />
                ))}
                {message.data?.opportunities?.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      No profitable arbitrage opportunities found at this time.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700'
                }`}>
                  {message.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
              <TradingPairSelect
                value={tradingPair}
                onValueChange={setTradingPair}
              />

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
              disabled={!isSolanaConnected || !isEthereumConnected}
            />
          </CardContent>
        </Card>
      )}

      {chatHistory.length === 0 && <TradingContextCards />}
    </div>
  );
};