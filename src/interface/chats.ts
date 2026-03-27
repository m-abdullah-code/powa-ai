
export interface CreateClientData {
    id?: number;
    engagement_id?: string;
    client_name: string;
    period: string;
}

export interface ChatMessage {
    id?: string;
    engagement_id?: string;
    workpaper_id?: string;
    text: string;
    isUser: boolean;
    timestamp?: string;
}