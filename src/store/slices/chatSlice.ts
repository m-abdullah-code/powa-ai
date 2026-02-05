import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../../interface/chats';

interface HistoryItem {
    sessionId: string;
    title: string;
}

interface ChatState {
    history: HistoryItem[];
    allSessions: { [sessionId: string]: ChatMessage[] };
    currentSessionId: string;
    loadingHistory: boolean;
}

const initialState: ChatState = {
    history: [],
    allSessions: {},
    currentSessionId: "",
    loadingHistory: false,
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
        setLoadingHistory: (state, action: PayloadAction<boolean>) => {
            state.loadingHistory = action.payload;
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
        }
    },
});

export const { 
    setHistory, 
    setAllSessions, 
    setCurrentSessionId, 
    setLoadingHistory, 
    addMessage, 
    updateOrAddHistory 
} = chatSlice.actions;

export default chatSlice.reducer;
