import { useEffect } from 'react';
import { IoChatbubbleOutline, IoAdd } from 'react-icons/io5';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
    setHistory,
    setAllSessions,
    setCurrentSessionId,
    setLoadingHistory
} from '../store/slices/chatSlice';
import { getChats } from '../api/chats';
import type { ConversationsResponse } from '../interface/chats';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const dispatch = useDispatch();
    const { history, currentSessionId, loadingHistory } = useSelector((state: RootState) => state.chat);

    const fetchHistoryList = async () => {
        dispatch(setLoadingHistory(true));
        try {
            const res = await getChats();
            const data: ConversationsResponse = res.data;
            const sessions = Object.entries(data.conversations);

            const sortedSessions = sessions
                .map(([id, msgs]) => {
                    const validMsgs = msgs.filter((m) => m?.content && m?.created_at);
                    const lastTime = validMsgs.length > 0 ? new Date(validMsgs[validMsgs.length - 1].created_at).getTime() : 0;
                    return { id, messages: validMsgs, lastTime };
                })
                .sort((a, b) => b.lastTime - a.lastTime);

            dispatch(setHistory(sortedSessions.map(s => ({
                sessionId: s.id,
                title: s.messages.find(m => m.role === 'user')?.content || "Consultation"
            }))));

            const sessionsObj: any = {};
            sortedSessions.forEach(s => {
                sessionsObj[s.id] = s.messages;
            });
            dispatch(setAllSessions(sessionsObj));

            // Removed automatic session selection on refresh
        } catch (err) {
            console.error("Error fetching history list", err);
        } finally {
            dispatch(setLoadingHistory(false));
        }
    };

    useEffect(() => {
        fetchHistoryList();
    }, []);

    const handleNewSession = () => {
        dispatch(setCurrentSessionId(crypto.randomUUID()));
        setIsOpen(false);
    };

    const handleSessionClick = (id: string) => {
        dispatch(setCurrentSessionId(id));
        setIsOpen(false);
    };

    return (
        <>
            <aside className={`
                    fixed z-50 top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    lg:translate-x-0 lg:static lg:block
                `}>

                {/* New Chat Button */}
                <div className="p-4 pt-24 lg:pt-4">
                    <button
                        onClick={handleNewSession}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all font-bold text-sm cursor-pointer"
                    >
                        <IoAdd size={18} />
                        New Session
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                    <h3 className="px-4 py-2 text-base font-semibold text-black-600 capitalize">Your Chats</h3>
                    {loadingHistory ? (
                        <div className="space-y-3 p-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        history.map((item) => (
                            <button
                                key={item.sessionId}
                                onClick={() => handleSessionClick(item.sessionId)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border text-sm ${currentSessionId === item.sessionId
                                    ? "bg-green-600 text-white border-green-500 shadow-md shadow-green-100"
                                    : "hover:bg-green-50 text-gray-800 border-transparent"
                                    }`}
                            >
                                <IoChatbubbleOutline className={currentSessionId === item.sessionId ? "text-white" : "text-gray-800"} size={18} />
                                <span className="text-sm font-medium truncate leading-tight tracking-tight">{item.title}</span>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}

export default Sidebar;