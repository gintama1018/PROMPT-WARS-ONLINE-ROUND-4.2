import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, venuesTable } from "@workspace/db";
import { GetVenueParams } from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /api/venues — list all venues */
router.get("/venues", async (_req, res): Promise<void> => {
  const venues = await db.select().from(venuesTable).orderBy(venuesTable.name);
  res.json(venues);
});

/** GET /api/venues/:id — get a venue by ID */
router.get("/venues/:id", async (req, res): Promise<void> => {
  const parsed = GetVenueParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [venue] = await db
    .select()
    .from(venuesTable)
    .where(eq(venuesTable.id, parsed.data.id));

  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  res.json(venue);
});

export default router;
