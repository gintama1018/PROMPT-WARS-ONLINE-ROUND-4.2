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
          aria-label={`Risk level: ${result.riskLevel}`}
        >
          {result.riskLevel} RISK
        </Badge>
      </div>

      {/*
       * role="alert" triggers an immediate announcement by screen readers —
       * appropriate here because a critical crowd alert demands urgent attention,
       * exactly like a visual "red text warning" does for sighted users.
       */}
      {result.alertMessage && (
        <p role="alert" className="text-sm font-medium mb-3 text-red-300">
          {result.alertMessage}
        </p>
      )}

      <ul className="text-sm space-y-2 text-slate-300 dark:text-muted-foreground" aria-label="Recommendations">
        {result.recommendations.map((rec, index) => (
          <li key={index} className="flex gap-2 items-start">
            {/* Purely decorative visual bullet — hidden from the a11y tree */}
            <div className="w-1 h-1 rounded-full bg-slate-500 mt-2 shrink-0" aria-hidden="true" />
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
          <Activity className="h-5 w-5" aria-hidden="true" />
          AI Crowd Analysis
        </CardTitle>
        <CardDescription className="text-slate-400 dark:text-muted-foreground">
          Predictive bottleneck modeling
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/*
         * Label–control association via htmlFor / id on every form control.
         * Without this, screen readers announce the input field name only if
         * the user is lucky enough to be using a browser that guesses it from
         * adjacent text — which is not reliable and fails automated a11y audits.
         *
         * For Shadcn <Select>, the id goes on <SelectTrigger> (the rendered button)
         * so that htmlFor on <Label> creates a valid programmatic association.
         */}

        {/* Venue selector */}
        <div className="space-y-2">
          <Label htmlFor="venue-select" className="text-slate-300 dark:text-muted-foreground">
            Venue
          </Label>
          <Select
            value={crowdInput.venue}
            onValueChange={(v) => setField("venue", v)}
          >
            <SelectTrigger
              id="venue-select"
              className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
            >
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
          <Label htmlFor="zone-input" className="text-slate-300 dark:text-muted-foreground">
            Zone
          </Label>
          <Input
            id="zone-input"
            value={crowdInput.zone}
            onChange={(e) => setField("zone", e.target.value)}
            placeholder="e.g. North Gate Entrance"
            className="bg-slate-800/50 border-slate-700 dark:bg-background dark:border-input"
          />
        </div>

        {/* Density input + analyze button */}
        <div className="space-y-2">
          <Label htmlFor="density-input" className="text-slate-300 dark:text-muted-foreground">
            Simulated Density (%)
          </Label>
          <div className="flex gap-4 items-center">
            <Input
              id="density-input"
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
              aria-busy={analyzeCrowd.isPending}
            >
              {analyzeCrowd.isPending ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </div>

        {/*
         * aria-live="polite" on the wrapper notifies screen readers when the
         * analysis result appears after the async call completes — without it,
         * the new content is silently inserted into the DOM with no announcement.
         * "polite" waits for the user to finish their current action before reading.
         * aria-atomic="true" ensures the full result block is read as a unit.
         */}
        <div aria-live="polite" aria-atomic="true">
          {analysisResult && <AnalysisResult result={analysisResult} />}
        </div>
      </CardContent>
    </Card>
  );
}
