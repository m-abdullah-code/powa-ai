import api from "./axios";
import type { CreateClientData } from "../interface/chats";

// create client
export const createClient = async (data: CreateClientData) => {
    return await api.post("/api/v1/audit/engagements/", data);
};

// get all clients
export const getClients = async () => {
    return await api.get("/api/v1/audit/engagements/");
};

// upload documents by client id
export const uploadDocuments = async (engagement_id: string, data: any) => {
    return await api.post(`/api/v1/audit/engagements/${engagement_id}/documents/upload`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

// workpapers chat 
export const workpapersChat = async (data: any) => {
    return await api.post(`/api/v1/audit/workpapers/chat`, data);
};

// get all workpapers chat by engagement id
export const getWorkpapersChat = async (engagement_id: string) => {
    return await api.get(`/api/v1/audit/workpapers/${engagement_id}`);
};

// detail workpapers chat by workpaper_id
export const getWorkpapersChatDetail = async (workpaper_id: string) => {
    return await api.get(`/api/v1/audit/workpapers/${workpaper_id}/detail`);
};

