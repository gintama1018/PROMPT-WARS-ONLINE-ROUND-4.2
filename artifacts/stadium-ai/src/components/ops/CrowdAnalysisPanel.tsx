import { useState } from "react";
import { Activity } from "lucide-react";
import { useAnalyzeCrowd } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCrowdRiskColor, cn } from "@/lib/utils";
import type { CrowdAnalysisResult } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Venue {
  id: number;
  name: string;
}

interface CrowdInputState {
  venue: string;
  zone: string;
  /** Stored as a string to bind directly to <input type="number"> without controlled-value gymnastics. */
  density: string;
}

const INITIAL_CROWD_INPUT: CrowdInputState = {
  venue:   "",
  zone:    "",
  density: "50",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AnalysisResultProps {
  result: CrowdAnalysisResult;
}

/**
 * Displays the AI-returned crowd analysis result.
 * Isolated so that its fade-in animation is scoped to this element only.
 */
function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="mt-6 p-4 rounded-lg bg-slate-800 border border-slate-700 dark:bg-secondary dark:border-border animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="outline"
          className={cn("uppercase text-[10px]", getCrowdRiskColor(result.riskLevel))}
        >
          {result.riskLevel} RISK
        </Badge>
      </div>

      {result.alertMessage && (
        <p className="text-sm font-medium mb-3 text-red-300">
          {result.alertMessage}
        </p>
      )}

      <ul className="text-sm space-y-2 text-slate-300 dark:text-muted-foreground">
        {result.recommendations.map((rec, index) => (
          <li key={index} className="flex gap-2 items-start">
            <div className="w-1 h-1 rounded-full bg-slate-500 mt-2 shrink-0" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * Self-contained AI crowd-analysis panel.
 * Manages its own form state so OpsDashboard stays slim.
 * Only requires `venues` as a prop (for the venue picker).
 */
export function CrowdAnalysisPanel({ venues }: { venues: Venue[] }) {
  const analyzeCrowd = useAnalyzeCrowd();

  const [crowdInput, setCrowdInput]         = useState<CrowdInputState>(INITIAL_CROWD_INPUT);
  const [analysisResult, setAnalysisResult] = useState<CrowdAnalysisResult | null>(null);

  /** Updates a single field without clobbering the rest of the form state. */
  const setField = <K extends keyof CrowdInputState>(key: K, value: CrowdInputState[K]) => {
    setCrowdInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    const isFormComplete = crowdInput.venue && crowdInput.zone;
    if (!isFormComplete) return;

    const result = await analyzeCrowd.mutateAsync({
      data: {
        venue:   crowdInput.venue,
        zone:    crowdInput.zone,
        density: parseInt(crowdInput.density, 10),
      },
    });

    setAnalysisResult(result);
  };

  return (
    <Card className="flex flex-col bg-slate-900 text-slate-50 border-slate-800 dark:bg-card dark:text-card-foreground dark:border-border">
      <CardHeader className="border-b border-slate-800 dark:border-border pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          AI Crowd Analysis
        </CardTitle>
        <CardDescription className="text-slate-400 dark:text-muted-foreground">
          Predictive bottleneck modeling
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Venue selector */}
        <div className="space-y-2">
          <Label className="text-slate-300 dark:text-muted-foreground">Venue</Label>
          <Select
            value={crowdInput.venue}
            onValueChange={(v) => setField("venue", v)}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input">
              <SelectValue placeholder="Select venue..." />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.name}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone input */}
        <div className="space-y-2">
          <Label className="text-slate-300 dark:text-muted-foreground">Zone</Label>
          <Input
            value={crowdInput.zone}
            onChange={(e) => setField("zone", e.target.value)}
            placeholder="e.g. North Gate Entrance"
            className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
          />
        </div>

        {/* Density input + analyze button */}
        <div className="space-y-2">
          <Label className="text-slate-300 dark:text-muted-foreground">
            Simulated Density (%)
          </Label>
          <div className="flex gap-4 items-center">
            <Input
              type="number"
              min="0"
              max="100"
              value={crowdInput.density}
              onChange={(e) => setField("density", e.target.value)}
              className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
            />
            <Button
              onClick={handleAnalyze}
              disabled={analyzeCrowd.isPending}
              variant="secondary"
            >
              {analyzeCrowd.isPending ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>

        {/* Analysis result — only rendered after a successful call */}
        {analysisResult && <AnalysisResult result={analysisResult} />}
      </CardContent>
    </Card>
  );
}
