import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../../interface/chats.ts';

interface HistoryItem {
    sessionId: string;
    title: string;
}

interface ChatState {
    history: HistoryItem[];
    allSessions: { [sessionId: string]: ChatMessage[] };
    currentSessionId: string;
    activeEngagementId: string | null;
    loadingHistory: boolean;
    refreshClientsTrigger: number;
    isHistoryMode: boolean;
}

const initialState: ChatState = {
    history: [],
    allSessions: {},
    currentSessionId: "",
    activeEngagementId: null,
    loadingHistory: false,
    refreshClientsTrigger: 0,
    isHistoryMode: false,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
            state.history = action.payload;
        },
        setAllSessions: (state, action: PayloadAction<{ [sessionId: string]: ChatMessage[] }>) => {
            state.allSessions = action.payload;
        },
        setCurrentSessionId: (state, action: PayloadAction<string>) => {
            state.currentSessionId = action.payload;
        },
        setActiveEngagementId: (state, action: PayloadAction<string | null>) => {
            state.activeEngagementId = action.payload;
        },
        setLoadingHistory: (state, action: PayloadAction<boolean>) => {
            state.loadingHistory = action.payload;
        },
        triggerRefreshClients: (state) => {
            state.refreshClientsTrigger += 1;
        },
        addMessage: (state, action: PayloadAction<{ sessionId: string, message: ChatMessage }>) => {
            const { sessionId, message } = action.payload;
            if (!state.allSessions[sessionId]) {
                state.allSessions[sessionId] = [];
            }
            state.allSessions[sessionId].push(message);
        },
        updateOrAddHistory: (state, action: PayloadAction<HistoryItem>) => {
            const index = state.history.findIndex(h => h.sessionId === action.payload.sessionId);
            if (index !== -1) {
                state.history[index] = action.payload;
            } else {
                state.history.unshift(action.payload);
            }
        },
        setIsHistoryMode: (state, action: PayloadAction<boolean>) => {
            state.isHistoryMode = action.payload;
        }
    },
});

export const { 
    setHistory, 
    setAllSessions, 
    setCurrentSessionId, 
    setActiveEngagementId,
    setLoadingHistory, 
    triggerRefreshClients,
    addMessage, 
    updateOrAddHistory,
    setIsHistoryMode
} = chatSlice.actions;

export default chatSlice.reducer;
