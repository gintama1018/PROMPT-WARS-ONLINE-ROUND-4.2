import { useState } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin,
  Clock,
  Activity,
  Plus
} from "lucide-react";
import { useOpsData } from "@/hooks/use-ops-data";
import { useTriageIncident, useAnalyzeCrowd } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPriorityColor, getDensityColor, cn } from "@/lib/utils";
import { priorities, modules } from "@/lib/constants";

export default function OpsDashboard() {
  const { stats, incidents, venues, handleCreateIncident, handleUpdateIncident, isLoading } = useOpsData();
  const triageIncident = useTriageIncident();
  const analyzeCrowd = useAnalyzeCrowd();

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({ title: "", description: "", location: "", module: modules[0].id, priority: "low" });
  
  const [crowdAnalysis, setCrowdAnalysis] = useState<{riskLevel: string, recommendations: string[], alertMessage?: string | null} | null>(null);
  const [crowdInput, setCrowdInput] = useState({ venue: "", zone: "", density: "50" });

  const onTriage = async () => {
    if (!newIncident.description) return;
    const res = await triageIncident.mutateAsync({
      data: {
        description: newIncident.description,
        location: newIncident.location
      }
    });
    setNewIncident(prev => ({ ...prev, priority: res.priority.toLowerCase() }));
  };

  const onSubmitIncident = async () => {
    await handleCreateIncident(newIncident);
    setIsIncidentModalOpen(false);
    setNewIncident({ title: "", description: "", location: "", module: modules[0].id, priority: "low" });
  };

  const onAnalyzeCrowd = async () => {
    if (!crowdInput.venue || !crowdInput.zone) return;
    const res = await analyzeCrowd.mutateAsync({
      data: {
        venue: crowdInput.venue,
        zone: crowdInput.zone,
        density: parseInt(crowdInput.density)
      }
    });
    setCrowdAnalysis(res);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time venue analytics and incident management.</p>
        </div>
        <Button onClick={() => setIsIncidentModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Active Venues</span>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono">
              {isLoading ? "-" : stats?.activeVenues}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Network Capacity</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={cn("text-3xl font-bold font-mono", stats && stats.crowdCapacityPercent >= 85 ? "text-red-500" : "")}>
              {isLoading ? "-" : `${stats?.crowdCapacityPercent}%`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-red-500 font-mono uppercase tracking-wider">Critical Incidents</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold font-mono text-red-500">
              {isLoading ? "-" : stats?.criticalIncidents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-green-600 font-mono uppercase tracking-wider">Resolved Today</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-3xl font-bold font-mono text-green-600">
              {isLoading ? "-" : stats?.resolvedToday}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incident Feed */}
        <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Live Incident Feed
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-0">
              {incidents?.filter(i => i.status !== 'resolved').length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No active incidents.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground font-mono text-xs uppercase sticky top-0 backdrop-blur">
                    <tr>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Priority</th>
                      <th className="px-6 py-3 font-medium">Incident</th>
                      <th className="px-6 py-3 font-medium">Location</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {incidents?.filter(i => i.status !== 'resolved').map((incident) => (
                      <tr key={incident.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                          {incident.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={cn("uppercase text-[10px]", getPriorityColor(incident.priority))}>
                            {incident.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{incident.title}</div>
                          <div className="text-muted-foreground text-xs truncate max-w-[200px] mt-1">{incident.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                          {incident.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateIncident(incident.id, { status: 'resolved' })}
                          >
                            Resolve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* AI Crowd Analysis */}
        <Card className="flex flex-col bg-slate-900 text-slate-50 border-slate-800 dark:bg-card dark:text-card-foreground dark:border-border">
          <CardHeader className="border-b border-slate-800 dark:border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Crowd Analysis
            </CardTitle>
            <CardDescription className="text-slate-400 dark:text-muted-foreground">Predictive bottleneck modeling</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-muted-foreground">Venue</Label>
              <Select value={crowdInput.venue} onValueChange={v => setCrowdInput(prev => ({...prev, venue: v}))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input">
                  <SelectValue placeholder="Select venue..." />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map(v => (
                    <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-muted-foreground">Zone</Label>
              <Input 
                value={crowdInput.zone}
                onChange={e => setCrowdInput(prev => ({...prev, zone: e.target.value}))}
                placeholder="e.g. North Gate Entrance"
                className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-muted-foreground">Simulated Density (%)</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  type="number" 
                  min="0" max="100"
                  value={crowdInput.density}
                  onChange={e => setCrowdInput(prev => ({...prev, density: e.target.value}))}
                  className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
                />
                <Button onClick={onAnalyzeCrowd} disabled={analyzeCrowd.isPending} variant="secondary">
                  Analyze
                </Button>
              </div>
            </div>

            {crowdAnalysis && (
              <div className="mt-6 p-4 rounded-lg bg-slate-800 border border-slate-700 dark:bg-secondary dark:border-border animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn("uppercase text-[10px]", 
                    crowdAnalysis.riskLevel === 'high' || crowdAnalysis.riskLevel === 'critical' ? 'text-red-400 border-red-400/50 bg-red-400/10' :
                    crowdAnalysis.riskLevel === 'medium' ? 'text-amber-400 border-amber-400/50 bg-amber-400/10' :
                    'text-green-400 border-green-400/50 bg-green-400/10'
                  )}>
                    {crowdAnalysis.riskLevel} RISK
                  </Badge>
                </div>
                {crowdAnalysis.alertMessage && (
                  <p className="text-sm font-medium mb-3 text-red-300">{crowdAnalysis.alertMessage}</p>
                )}
                <ul className="text-sm space-y-2 text-slate-300 dark:text-muted-foreground">
                  {crowdAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <div className="w-1 h-1 rounded-full bg-slate-500 mt-2 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={newIncident.title} 
                onChange={e => setNewIncident(prev => ({...prev, title: e.target.value}))} 
                placeholder="Brief summary..." 
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={newIncident.location} 
                onChange={e => setNewIncident(prev => ({...prev, location: e.target.value}))} 
                placeholder="Gate, Section, etc." 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={newIncident.description} 
                onChange={e => setNewIncident(prev => ({...prev, description: e.target.value}))} 
                placeholder="Detailed description..." 
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Module</Label>
                <Select value={newIncident.module} onValueChange={v => setNewIncident(prev => ({...prev, module: v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Priority</Label>
                <Select value={newIncident.priority} onValueChange={v => setNewIncident(prev => ({...prev, priority: v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={onTriage} disabled={triageIncident.isPending || !newIncident.description}>
              {triageIncident.isPending ? "Triaging..." : "Auto-Triage with AI"}
            </Button>
            <Button onClick={onSubmitIncident} disabled={!newIncident.title || !newIncident.description}>
              Submit Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
