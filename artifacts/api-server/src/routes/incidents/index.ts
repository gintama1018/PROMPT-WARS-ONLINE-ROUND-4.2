import { Router, type IRouter } from "express";
import { eq, and, type SQL } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import {
  CreateIncidentBody,
  UpdateIncidentParams,
  UpdateIncidentBody,
  DeleteIncidentParams,
  ListIncidentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /api/incidents — list incidents with optional filters */
router.get("/incidents", async (req, res): Promise<void> => {
  const queryParsed = ListIncidentsQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { status, priority, module } = queryParsed.data;

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(incidentsTable.status, status));
  if (priority) conditions.push(eq(incidentsTable.priority, priority));
  if (module) conditions.push(eq(incidentsTable.module, module));

  const incidents = await db
    .select()
    .from(incidentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(incidentsTable.createdAt);

  res.json(incidents);
});

/** POST /api/incidents — create a new incident */
router.post("/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [incident] = await db
    .insert(incidentsTable)
    .values(parsed.data)
    .returning();

  req.log.info({ incidentId: incident.id, priority: incident.priority }, "Incident created");
  res.status(201).json(incident);
});

/** PATCH /api/incidents/:id — update an incident */
router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateIncidentParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const bodyParsed = UpdateIncidentBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  // Filter out null values — only update fields that were explicitly provided
  const updateData: Record<string, string> = {};
  for (const [key, value] of Object.entries(bodyParsed.data)) {
    if (value !== null && value !== undefined) {
      updateData[key] = value as string;
    }
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [incident] = await db
    .update(incidentsTable)
    .set(updateData)
    .where(eq(incidentsTable.id, paramsParsed.data.id))
    .returning();

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json(incident);
});

/** DELETE /api/incidents/:id — delete an incident */
router.delete("/incidents/:id", async (req, res): Promise<void> => {
  const paramsParsed = DeleteIncidentParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const [incident] = await db
    .delete(incidentsTable)
    .where(eq(incidentsTable.id, paramsParsed.data.id))
    .returning();

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
