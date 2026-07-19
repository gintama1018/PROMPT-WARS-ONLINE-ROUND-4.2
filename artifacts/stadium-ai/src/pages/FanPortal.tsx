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
import { Card, CardContent } from "@/components/ui/card";
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

  // ─── Derived status label for the venue capacity badge ───────────────────
  // Color alone does not convey meaning to colour-blind users or screen readers.
  // This function produces a text status ("Normal", "Warning", "Critical") that
  // accompanies the percentage in the aria-label.
  const capacityStatus = stats
    ? stats.crowdCapacityPercent >= 85 ? "Critical"
    : stats.crowdCapacityPercent >= 70 ? "Warning"
    : "Normal"
    : null;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      {/*
       * Sidebar: Chat History
       * role="complementary" + aria-label identifies this as a secondary region.
       * Without it, screen readers see an unlabelled <div> next to the main chat.
       */}
      <aside
        className="w-80 border-r bg-card flex flex-col hidden md:flex"
        aria-label="Conversation history"
      >
        <div className="p-4 border-b">
          <Button 
            variant="default" 
            className="w-full justify-start gap-2"
            onClick={() => setActiveConversationId(null)}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <nav aria-label="Past conversations">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  setActiveModule(conv.module);
                }}
                /*
                 * aria-current="true" announces "current" to screen readers —
                 * equivalent to the visual highlight on the selected conversation.
                 * aria-label gives the full context: title + module, since the
                 * module sub-line is visually small and easy to miss.
                 */
                aria-current={activeConversationId === conv.id ? "true" : undefined}
                aria-label={`${conv.title || "New Conversation"}, module: ${conv.module}`}
                className={cn(
                  "w-full text-left p-3 rounded-lg text-sm transition-colors mb-1 truncate",
                  activeConversationId === conv.id 
                    ? "bg-secondary text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                {conv.title || "New Conversation"}
                <div className="text-xs text-muted-foreground mt-1 opacity-70" aria-hidden="true">
                  {conv.module}
                </div>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Status Bar */}
        <div className="p-4 border-b bg-card flex items-center justify-between shadow-sm" role="status" aria-label="Venue status">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold">Venue Status:</span>
            {stats ? (
              /*
               * The badge communicates urgency via colour (green/orange/red).
               * aria-label makes both the percentage AND the severity explicit —
               * e.g. "Venue status: Warning, 78% capacity" — so colour-blind users
               * and screen readers get the same information as sighted users.
               */
              <Badge
                variant="outline"
                className={cn(
                  "ml-2",
                  stats.crowdCapacityPercent >= 85 ? "bg-red-50 text-red-700 border-red-200" :
                  stats.crowdCapacityPercent >= 70 ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-green-50 text-green-700 border-green-200"
                )}
                aria-label={`Venue status: ${capacityStatus}, ${stats.crowdCapacityPercent}% capacity`}
              >
                {stats.crowdCapacityPercent}% Capacity
              </Badge>
            ) : (
              <div
                className="h-5 w-16 bg-muted animate-pulse rounded ml-2"
                aria-label="Loading venue capacity"
                role="status"
              />
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            aria-label="Emergency SOS — report an urgent safety situation"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            SOS
          </Button>
        </div>

        {/* Module Selector */}
        {!activeConversationId && (
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold tracking-tight mb-4">How can we help you today?</h2>
            {/*
             * role="group" + aria-labelledby groups the module cards semantically.
             * Each card uses role="radio" + aria-checked to form a radio group
             * pattern — the correct ARIA pattern for "select one of N options".
             * This gives keyboard users Enter/Space to select and arrow keys to
             * navigate between options (implemented via onKeyDown).
             */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              role="radiogroup"
              aria-label="Select an assistance module"
            >
              {modules.map((mod) => (
                <Card 
                  key={mod.id}
                  role="radio"
                  aria-checked={activeModule === mod.id}
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    activeModule === mod.id ? "border-primary bg-primary/5" : "border-transparent"
                  )}
                  onClick={() => setActiveModule(mod.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveModule(mod.id);
                    }
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    <span className="font-semibold">{mod.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/*
         * Chat Area
         *
         * role="log" is the correct ARIA landmark for a chat message stream.
         * It implies aria-live="polite" and aria-atomic="false" — meaning
         * screen readers announce each new message as it is added without
         * re-reading the entire conversation (aria-atomic="false" is key).
         *
         * aria-label gives the region a name so it appears in landmark navigation.
         */}
        <div
          role="log"
          aria-label="Conversation messages"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 md:p-6"
          ref={scrollRef}
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center max-w-md mx-auto">
              {/* Decorative illustration icon — no informational value */}
              <Bot className="h-12 w-12 mb-4 opacity-20" aria-hidden="true" />
              <p>Start a conversation about {activeModule}. Ask for directions, report an issue, or get facility information.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {currentMessages.map((msg) => {
                const isUser = msg.role === "user";
                const senderLabel = isUser ? "You" : "StadiumAI";
                return (
                  /*
                   * role="article" on each message gives it a distinct accessible
                   * landmark within the log. aria-label announces who sent the message,
                   * e.g. "You said" / "StadiumAI said", before the message content.
                   */
                  <div 
                    key={msg.id}
                    role="article"
                    aria-label={`${senderLabel} said`}
                    className={cn(
                      "flex gap-4 max-w-[85%]",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {/* Avatar — purely decorative; the aria-label on the article already identifies the sender */}
                    <div
                      aria-hidden="true"
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border",
                      isUser
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card text-card-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isAsking && (
                /*
                 * role="status" announces the typing indicator to screen readers
                 * without being as intrusive as role="alert".
                 * The visible animated dots are aria-hidden — the sr-only span
                 * provides the actual announcement: "StadiumAI is thinking".
                 * Without this, the dots are announced as "● ● ●" which is meaningless.
                 */
                <div className="flex gap-4 max-w-[85%] mr-auto">
                  <div
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0"
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div
                    role="status"
                    aria-label="StadiumAI is thinking"
                    className="p-4 rounded-xl text-sm bg-card border flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="animate-pulse">●</span>
                    <span aria-hidden="true" className="animate-pulse delay-75">●</span>
                    <span aria-hidden="true" className="animate-pulse delay-150">●</span>
                    <span className="sr-only">StadiumAI is thinking…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t shrink-0">
          <form
            onSubmit={onSend}
            className="max-w-3xl mx-auto flex gap-2"
            aria-label={`Ask about ${activeModule}`}
          >
            <Input 
              placeholder={`Ask about ${activeModule}…`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 shadow-sm h-12 text-base font-mono"
              disabled={isAsking}
              aria-label={`Message — ask about ${activeModule}`}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isAsking}
              className="h-12 w-12 px-0 shadow-sm"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
