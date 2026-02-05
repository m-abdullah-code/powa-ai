import api from "./axios";


export const chats = async (data: any) => {
    return await api.post("/chat", data);
};

export const getChats = async () => {
    return await api.get("/chat/conversations");
};

export const pdfGenerate = async (sessionId: string) => {
    return await api.post(`/generate-referral-pdf?session_id=${sessionId}`, {}, { responseType: 'blob' });
};