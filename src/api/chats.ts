import api from "./axios";

// Send a message to the chat
export const chats = async (data: any) => {
    return await api.post("/chat", data);
};

// Get all conversations
export const getChats = async () => {
    return await api.get("/chat/conversations");
};

// Generate referral PDF
export const generateReferral = async (sessionId: string) => {
    return await api.post(`/generate-referral-pdf?session_id=${sessionId}`, {}, { responseType: 'blob' });
};

// Upload medical report 
export const uploadFile = async (sessionId: string, data: FormData) => {
    return await api.post(`/upload-medical-report?session_id=${sessionId}`, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};