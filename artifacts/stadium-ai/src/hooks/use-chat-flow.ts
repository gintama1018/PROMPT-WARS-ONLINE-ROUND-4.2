import { 
  useAskAI, 
  useCreateConversation, 
  useGetConversation, 
  useListConversations, 
  useSendMessage 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListConversationsQueryKey, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useCallback, useRef, useState } from "react";

export function useChatFlow() {
  const queryClient = useQueryClient();
  const askAI = useAskAI();
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  const handleStartChat = useCallback(async (module: string, initialQuery: string) => {
    // 1. Create conversation
    const conv = await createConversation.mutateAsync({
      data: { title: initialQuery.slice(0, 50), module }
    });
    
    // 2. Ask AI to get answer
    const aiRes = await askAI.mutateAsync({
      data: { module, query: initialQuery }
    });

    // 3. Add user message
    await sendMessage.mutateAsync({
      id: conv.id,
      data: { content: initialQuery }
    });

    // 4. Add AI response
    await sendMessage.mutateAsync({
      id: conv.id,
      data: { content: aiRes.answer }
    });

    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    return conv.id;
  }, [createConversation, askAI, sendMessage, queryClient]);

  const handleSendMessage = useCallback(async (conversationId: number, module: string, query: string, context?: string) => {
    // 1. Send User message to DB
    await sendMessage.mutateAsync({
      id: conversationId,
      data: { content: query }
    });

    // 2. Ask AI
    const aiRes = await askAI.mutateAsync({
      data: { module, query, context }
    });

    // 3. Save AI response
    await sendMessage.mutateAsync({
      id: conversationId,
      data: { content: aiRes.answer }
    });

    queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
    return aiRes;
  }, [askAI, sendMessage, queryClient]);

  return {
    handleStartChat,
    handleSendMessage,
    isAsking: askAI.isPending,
  };
}
