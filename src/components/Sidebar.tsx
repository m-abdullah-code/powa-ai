import { useEffect, useState, useRef } from 'react';
import { IoChatbubbleOutline, IoAdd, IoPersonCircleOutline, IoLogOutOutline } from 'react-icons/io5';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import {
    setHistory,
    setAllSessions,
    setCurrentSessionId,
    setLoadingHistory
} from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import { getChats } from '../api/chats';
import type { ConversationsResponse } from '../interface/chats';
import { generateUUID } from '../utils/uuid';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { history, currentSessionId, loadingHistory } = useSelector((state: RootState) => state.chat);
    const { user } = useSelector((state: RootState) => state.auth);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Logout function
    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

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
        dispatch(setCurrentSessionId(generateUUID()));
        setIsOpen(false);
    };

    const handleSessionClick = (id: string) => {
        dispatch(setCurrentSessionId(id));
        setIsOpen(false);
    };

    return (
        <>
            <aside className={`
                    fixed z-50 top-0 left-0 h-screen lg:h-[90vh] w-64 bg-white border-r border-gray-200 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    lg:translate-x-0 lg:static lg:block
                `}
                style={{ display: "flex" }}
            >

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
                <div className="flex-1 overflow-y-auto px-3 space-y-1
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                [&::-webkit-scrollbar-thumb]:rounded-full
                ">
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
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left border-gray-200 border-b text-sm m-0 ${currentSessionId === item.sessionId
                                    ? "bg-green-600 text-white border-green-500 shadow-md shadow-green-100"
                                    : "hover:bg-green-50 text-gray-800"
                                    }`}
                            >
                                <IoChatbubbleOutline className={currentSessionId === item.sessionId ? "text-white" : "text-gray-800"} size={18} />
                                <span className="text-sm font-medium truncate leading-tight tracking-tight">{item.title}</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Profile Section */}
                <div className="p-4 border-t border-gray-100 relative" ref={dropdownRef}>
                    {isProfileOpen && (
                        <div className="absolute bottom-full left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-xl z-60 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="p-4 border-b border-gray-50">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                            </div>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                            >
                                <IoLogOutOutline size={18} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    )}

                    {/* Profile button */}
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${isProfileOpen ? 'bg-gray-50 border-gray-200' : 'border-transparent hover:bg-gray-50'
                            }`}
                    >
                        <div className="shrink-0">
                            <IoPersonCircleOutline size={32} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold text-gray-800 truncate">
                                {user?.username || "Guest User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                View Profile
                            </p>
                        </div>
                    </button>
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