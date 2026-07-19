import { useState } from "react";
import { useListVenues, useGetDashboardStats } from "@workspace/api-client-react";
import { useChatFlow } from "@/hooks/use-chat-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Bot, Send, CalendarClock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getDensityProgressColor } from "@/lib/utils";

export default function VolunteerHub() {
  const { data: venues } = useListVenues();
  const { data: stats } = useGetDashboardStats();
  
  const { handleStartChat, handleSendMessage, isAsking } = useChatFlow();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAsking) return;

    const msg = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);

    if (!activeConversationId) {
      const newId = await handleStartChat("Navigation", msg);
      setActiveConversationId(newId);
      // Mock the AI response locally for immediate feedback since we don't refetch the conv here
      setMessages(prev => [...prev, { role: "assistant", content: "I'm checking the latest operational guidelines for you..." }]);
    } else {
      const context = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const res = await handleSendMessage(activeConversationId, "Navigation", msg, context);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volunteer Hub</h1>
          <p className="text-muted-foreground mt-1">Your shift overview and AI operational assistant.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border rounded-lg px-4 py-2 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-mono uppercase">Total Active Shift</span>
            <span className="font-bold font-mono">{stats?.volunteerCount || "-"} Volunteers</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Venue Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Venue Assignments Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues?.map(venue => (
              <Card key={venue.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="h-2 w-full bg-secondary">
                  <div 
                    className={cn("h-full", getDensityProgressColor(venue.crowdDensity))}
                    style={{ width: `${venue.crowdDensity}%` }}
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <CardDescription>{venue.city}, {venue.country}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-muted-foreground">Density</span>
                    <span className="font-mono font-medium">{venue.crowdDensity}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 p-2 rounded-md text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Staffed: Required
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Your Next Shift: North Gate Control</h3>
                <p className="text-sm text-muted-foreground mb-3">Please report to Zone B staging area 15 minutes before shift start. Ensure radio is charged.</p>
                <Button size="sm">Check In</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Helper */}
        <Card className="flex flex-col h-[600px] shadow-md border-primary/10">
          <CardHeader className="border-b bg-card">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Volunteer AI Assistant
            </CardTitle>
            <CardDescription>Ask policy, navigation, or translation questions</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <Bot className="h-12 w-12 opacity-20 mb-4" />
                <p className="text-sm">"Where is the nearest accessible bathroom to Section 112?"</p>
                <p className="text-sm mt-2">"What is the procedure for a lost child?"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm",
                    msg.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-secondary text-secondary-foreground"
                  )}>
                    {msg.content}
                  </div>
                ))}
                {isAsking && (
                  <div className="max-w-[85%] mr-auto rounded-lg p-3 bg-secondary text-secondary-foreground text-sm flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-75">.</span>
                    <span className="animate-bounce delay-150">.</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="p-4 border-t bg-card mt-auto">
            <form onSubmit={onSend} className="flex gap-2">
              <Input 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask assistant..."
                className="flex-1"
                disabled={isAsking}
              />
              <Button type="submit" size="icon" disabled={!inputMessage.trim() || isAsking}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
