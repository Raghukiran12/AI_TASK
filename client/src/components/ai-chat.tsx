import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTaskSuggestions } from "@/lib/openai";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AiChat({ taskTitle, taskDescription }: { taskTitle: string, taskDescription: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: `How can I help you with your task "${taskTitle}"?` 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await getTaskSuggestions(
        `Task: ${taskTitle}\nDescription: ${taskDescription}\nUser Question: ${userMessage}`
      );

      const formattedContent = [
        "Here's my analysis:",
        "\nBreakdown of steps:",
        ...response.steps.map((step: string, i: number) => `${i + 1}. ${step}`),
        "\nSuggestions for completion:",
        ...response.suggestions.map((suggestion: string) => `• ${suggestion}`),
        "\nEstimated completion time:",
        response.estimatedTime
      ].join('\n');

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formattedContent },
      ]);
    } catch (error) {
      console.error("AI Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again in a moment.",
        },
      ]);

      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="font-semibold mb-4">AI Assistant</div>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about this task..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}