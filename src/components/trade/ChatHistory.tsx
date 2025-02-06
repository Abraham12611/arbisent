import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export const ChatHistory = ({ messages }: ChatHistoryProps) => {
  if (messages.length === 0) return null;

  return (
    <div className="mb-4 space-y-4 max-h-[400px] overflow-y-auto">
      {messages.map((message, index) => (
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
  );
};