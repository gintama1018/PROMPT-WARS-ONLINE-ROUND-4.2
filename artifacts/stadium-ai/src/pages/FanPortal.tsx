import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  AlertTriangle, 
  MapPin, 
  Bot, 
  User, 
  MessageSquare,
  Activity
} from "lucide-react";
import { useListConversations, useGetConversation, useGetDashboardStats } from "@workspace/api-client-react";
import { useChatFlow } from "@/hooks/use-chat-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { modules } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function FanPortal() {
  const [activeModule, setActiveModule] = useState<string>(modules[0].id);
  const [inputMessage, setInputMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const { data: stats } = useGetDashboardStats();
  const { data: conversations } = useListConversations();
  
  const { data: activeConversation } = useGetConversation(
    activeConversationId as number, 
    { query: { enabled: !!activeConversationId } }
  );

  const { handleStartChat, handleSendMessage, isAsking } = useChatFlow();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, isAsking]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAsking) return;

    const msg = inputMessage;
    setInputMessage("");

    if (!activeConversationId) {
      const newId = await handleStartChat(activeModule, msg);
      setActiveConversationId(newId);
    } else {
      const context = activeConversation?.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      await handleSendMessage(activeConversationId, activeModule, msg, context);
    }
  };

  const currentMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return activeConversation?.messages || [];
  }, [activeConversationId, activeConversation?.messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Sidebar: Chat History */}
      <div className="w-80 border-r bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Button 
            variant="default" 
            className="w-full justify-start gap-2"
            onClick={() => setActiveConversationId(null)}
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConversationId(conv.id);
                setActiveModule(conv.module);
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg text-sm transition-colors mb-1 truncate",
                activeConversationId === conv.id 
                  ? "bg-secondary text-foreground font-medium" 
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {conv.title || "New Conversation"}
              <div className="text-xs text-muted-foreground mt-1 opacity-70">
                {conv.module}
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Status Bar */}
        <div className="p-4 border-b bg-card flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Venue Status:</span>
            {stats ? (
              <Badge variant="outline" className={cn(
                "ml-2",
                stats.crowdCapacityPercent >= 85 ? "bg-red-50 text-red-700 border-red-200" :
                stats.crowdCapacityPercent >= 70 ? "bg-orange-50 text-orange-700 border-orange-200" :
                "bg-green-50 text-green-700 border-green-200"
              )}>
                {stats.crowdCapacityPercent}% Capacity
              </Badge>
            ) : (
              <div className="h-5 w-16 bg-muted animate-pulse rounded ml-2" />
            )}
          </div>
          <Button variant="destructive" size="sm" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            SOS
          </Button>
        </div>

        {/* Module Selector */}
        {!activeConversationId && (
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold tracking-tight mb-4">How can we help you today?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {modules.map((mod) => (
                <Card 
                  key={mod.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    activeModule === mod.id ? "border-primary bg-primary/5" : "border-transparent"
                  )}
                  onClick={() => setActiveModule(mod.id)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    <span className="font-semibold">{mod.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center max-w-md mx-auto">
              <Bot className="h-12 w-12 mb-4 opacity-20" />
              <p>Start a conversation about {activeModule}. Ask for directions, report an issue, or get facility information.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {currentMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-4 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card text-card-foreground"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex gap-4 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-4 rounded-xl text-sm bg-card border flex items-center gap-2">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-75">●</span>
                    <span className="animate-pulse delay-150">●</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t shrink-0">
          <form onSubmit={onSend} className="max-w-3xl mx-auto flex gap-2">
            <Input 
              placeholder={`Ask about ${activeModule}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 shadow-sm h-12 text-base font-mono"
              disabled={isAsking}
            />
            <Button type="submit" disabled={!inputMessage.trim() || isAsking} className="h-12 w-12 px-0 shadow-sm">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
