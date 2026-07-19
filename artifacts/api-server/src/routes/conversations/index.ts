import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { generateFromHistory } from "../../lib/ai-client";
import { buildModuleSystemInstruction } from "../../lib/ai-prompts";

const router: IRouter = Router();

/** GET /api/conversations — list all conversations */
router.get("/conversations", async (_req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt);
  res.json(conversations);
});

/** POST /api/conversations — create a new conversation */
router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(conversation);
});

/** GET /api/conversations/:id — get conversation with all messages */
router.get("/conversations/:id", async (req, res): Promise<void> => {
  const parsed = GetConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, parsed.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parsed.data.id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conversation, messages });
});

/** DELETE /api/conversations/:id — delete a conversation */
router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const parsed = DeleteConversationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, parsed.data.id))
    .returning();

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

/** GET /api/conversations/:id/messages — list messages */
router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const parsed = ListMessagesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parsed.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

/** POST /api/conversations/:id/messages — send a message + get AI response */
router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const paramsParsed = SendMessageParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const bodyParsed = SendMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const conversationId = paramsParsed.data.id;

  // Verify conversation exists
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  const [userMessage] = await db
    .insert(messagesTable)
    .values({ conversationId, role: "user", content: bodyParsed.data.content })
    .returning();

  // Load conversation history for context
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  const systemInstruction = buildModuleSystemInstruction(conversation.module);

  // Build message history for Gemini (map "assistant" → "model")
  const geminiMessages = history.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    content: m.content,
  }));

  try {
    const aiText = await generateFromHistory(geminiMessages, { systemInstruction });

    const [assistantMessage] = await db
      .insert(messagesTable)
      .values({ conversationId, role: "assistant", content: aiText })
      .returning();

    req.log.info(
      { conversationId, messageId: assistantMessage.id },
      "AI message saved"
    );
    res.json(assistantMessage);
  } catch (err) {
    req.log.error({ err }, "AI response failed for conversation");
    // Remove the user message we saved since we couldn't respond
    await db.delete(messagesTable).where(eq(messagesTable.id, userMessage.id));
    res.status(503).json({ error: "AI service temporarily unavailable. Please try again." });
  }
});

export default router;
