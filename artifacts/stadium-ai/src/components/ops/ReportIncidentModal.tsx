import { useState } from "react";
import { useTriageIncident } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modules, priorities, INCIDENT_DEFAULTS } from "@/lib/constants";
import type { NewIncidentForm } from "@/lib/types";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ReportIncidentModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSubmit:  (form: NewIncidentForm) => Promise<void>;
  isSubmitting: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Modal for creating a new incident.
 *
 * Owns its own form state so the parent (OpsDashboard) only
 * needs to know when the modal opens/closes and handle the final submit.
 * Includes an "Auto-Triage with AI" action that calls the triage endpoint
 * and pre-fills the priority field with the AI's recommendation.
 */
export function ReportIncidentModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportIncidentModalProps) {
  const triageIncident = useTriageIncident();

  const [form, setForm] = useState<NewIncidentForm>(INCIDENT_DEFAULTS);

  /** Generic field updater — avoids a separate handler per input. */
  const setField = <K extends keyof NewIncidentForm>(key: K, value: NewIncidentForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(INCIDENT_DEFAULTS);
    onClose();
  };

  /**
   * Sends the current description to the AI triage endpoint and pre-fills
   * the priority field with the returned recommendation.
   */
  const handleAutoTriage = async () => {
    if (!form.description) return;

    const result = await triageIncident.mutateAsync({
      data: { description: form.description, location: form.location },
    });

    setField("priority", result.priority.toLowerCase());
  };

  const handleSubmit = async () => {
    await onSubmit(form);
    handleClose();
  };

  const isSubmitDisabled = !form.title || !form.description || isSubmitting;
  const isTriageDisabled = !form.description || triageIncident.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report New Incident</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="incident-title">Title</Label>
            <Input
              id="incident-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Brief summary..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident-location">Location</Label>
            <Input
              id="incident-location"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="Gate, Section, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident-description">Description</Label>
            <Textarea
              id="incident-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Detailed description..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label>Module</Label>
              <Select
                value={form.module}
                onValueChange={(v) => setField("module", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setField("priority", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            onClick={handleAutoTriage}
            disabled={isTriageDisabled}
          >
            {triageIncident.isPending ? "Triaging..." : "Auto-Triage with AI"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? "Submitting..." : "Submit Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
