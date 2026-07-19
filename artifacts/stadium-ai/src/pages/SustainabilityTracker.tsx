import { useState } from "react";
import { useGetDashboardStats, useListVenues, useTranslateText } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, Globe, Wind, Zap, ArrowRight, Languages } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function SustainabilityTracker() {
  const { data: stats } = useGetDashboardStats();
  const { data: venues } = useListVenues();
  const translateText = useTranslateText();

  const [translateForm, setTranslateForm] = useState({ text: "", targetLanguage: "es" });
  const [translatedResult, setTranslatedResult] = useState("");

  const onTranslate = async () => {
    if (!translateForm.text) return;
    const res = await translateText.mutateAsync({
      data: { text: translateForm.text, targetLanguage: translateForm.targetLanguage }
    });
    setTranslatedResult(res.translatedText);
  };

  const languages = [
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "French" },
    { code: "pt", label: "Portuguese" },
    { code: "zh", label: "Chinese" },
    { code: "ja", label: "Japanese" }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-700 dark:text-green-500">Sustainability & Broadcast Hub</h1>
          <p className="text-muted-foreground mt-1">Monitor eco-metrics and manage multilingual communications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Massive Carbon Saved Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 border-green-200 dark:border-green-900/50">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-200 dark:bg-green-900/50 p-3 rounded-full text-green-700 dark:text-green-400">
                <Leaf className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-green-900 dark:text-green-100 uppercase tracking-widest">Total Carbon Saved</h2>
            </div>
            <div className="text-6xl md:text-8xl font-black text-green-700 dark:text-green-400 font-mono tracking-tighter">
              {stats?.carbonSavedKg ? stats.carbonSavedKg.toLocaleString() : "-"} <span className="text-3xl md:text-5xl text-green-600/50 dark:text-green-500/30 font-sans tracking-normal">kg</span>
            </div>
            <p className="mt-4 text-green-800 dark:text-green-200 font-medium max-w-lg">
              Calculated across {stats?.activeVenues || 0} active venues through optimized transport routing, automated HVAC controls, and waste diversion programs.
            </p>
          </CardContent>
        </Card>

        {/* Eco Sub-metrics */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1">
            <CardContent className="p-6 flex flex-col justify-center h-full gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">HVAC Optimization</span>
                <Wind className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold">24.5%</div>
                <div className="text-sm text-muted-foreground mt-1">Energy reduction today</div>
              </div>
              <Progress value={24.5} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-6 flex flex-col justify-center h-full gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Smart Lighting</span>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold">12 MWh</div>
                <div className="text-sm text-muted-foreground mt-1">Conserved via occupancy sensors</div>
              </div>
              <Progress value={65} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Venue Efficiency Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Venue Occupancy Efficiency
            </CardTitle>
            <CardDescription>Capacity vs Energy Load</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {venues?.map(venue => (
              <div key={venue.id} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{venue.name}</span>
                  <span className="font-mono text-muted-foreground">{venue.currentOccupancy.toLocaleString()} / {venue.capacity.toLocaleString()}</span>
                </div>
                <div className="relative h-4 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-500"
                    style={{ width: `${(venue.currentOccupancy / venue.capacity) * 100}%` }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                    style={{ width: `${venue.crowdDensity}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                  <span>Capacity Utilization</span>
                  <span>Density {venue.crowdDensity}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Translator Panel */}
        <Card className="flex flex-col border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Languages className="h-5 w-5" />
              Broadcast Translator AI
            </CardTitle>
            <CardDescription>Instantly translate PA announcements for digital boards.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-2">
              <Select value={translateForm.targetLanguage} onValueChange={v => setTranslateForm(prev => ({...prev, targetLanguage: v}))}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[200px]">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Source English</span>
                <Textarea 
                  className="flex-1 resize-none bg-muted/30"
                  placeholder="Enter announcement text..."
                  value={translateForm.text}
                  onChange={e => setTranslateForm(prev => ({...prev, text: e.target.value}))}
                />
              </div>
              <div className="flex flex-col gap-2 relative">
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Translated Result</span>
                <div className="flex-1 rounded-md border bg-primary/5 p-4 text-sm whitespace-pre-wrap flex flex-col">
                  {translateText.isPending ? (
                    <div className="m-auto text-primary animate-pulse">Translating...</div>
                  ) : translatedResult ? (
                    <span className="text-primary-foreground font-medium text-base leading-relaxed text-foreground">{translatedResult}</span>
                  ) : (
                    <span className="m-auto text-muted-foreground/50">Translation will appear here</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t bg-card flex justify-end">
            <Button onClick={onTranslate} disabled={!translateForm.text || translateText.isPending} className="gap-2">
              Translate & Preview <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
