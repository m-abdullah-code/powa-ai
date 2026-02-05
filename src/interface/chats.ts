export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationsResponse {
  status: string;
  user_id: number;
  conversations: {
    [sessionId: string]: ConversationMessage[];
  };
}

export interface ChatResponse {
  status: string;
  session_id: string;
  content?: string;
  message?: string;
}
