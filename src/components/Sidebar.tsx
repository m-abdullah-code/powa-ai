import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getClients, deleteClient } from '../api/chats';
import type { CreateClientData } from '../interface/chats';
import { setActiveEngagementId, setActiveClientName, setIsHistoryMode, triggerRefreshClients } from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import type { RootState } from '../store/store';
import toast from 'react-hot-toast';
import { HiOutlineOfficeBuilding, HiOutlineChevronDown, HiOutlineLogout, HiOutlineUserCircle } from 'react-icons/hi';
import { RiDeleteBin6Line } from "react-icons/ri";
import { FiUsers, FiPlus, FiX } from 'react-icons/fi';
import DeleteModal from './DeleteModal';

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const activeEngagementId = useSelector((state: RootState) => state.chat.activeEngagementId);
    const refreshClientsTrigger = useSelector((state: RootState) => state.chat.refreshClientsTrigger);
    const user = useSelector((state: RootState) => state.auth.user);

    const [clients, setClients] = useState<CreateClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<{ id: string, name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await getClients();
            if (response.status === 200) {
                const fetchedClients = response.data || [];
                setClients([...fetchedClients].reverse());
            }
        } catch (error) {
            console.error("Failed to fetch clients:", error);
            toast.error("Failed to load clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [refreshClientsTrigger]);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate('/login');
    };

    const openDeleteModal = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setClientToDelete({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await deleteClient(clientToDelete.id);
            if (response.status === 200 || response.status === 204 || response.status === 201) {
                toast.success("Client deleted successfully");
                dispatch(triggerRefreshClients());
                if (activeEngagementId === clientToDelete.id) {
                    dispatch(setActiveEngagementId(null));
                    dispatch(setActiveClientName(null));
                }
                setIsDeleteModalOpen(false);
            } else {
                toast.error("Failed to delete client");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("An error occurred while deleting");
        } finally {
            setDeleteLoading(false);
            setClientToDelete(null);
        }
    };

    return (
        <div className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 h-full flex flex-col text-slate-300 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">POWA AI</h2>
                </div>
                
                {/* Close Button (Mobile Only) */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden cursor-pointer"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>
            
            <div className="px-6 py-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mt-4 mb-2">
                    <span>Recent Clients</span>
                    <FiUsers className="w-4 h-4" />
                </div>
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col space-y-3 px-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-slate-800/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : clients.length > 0 ? (
                    <ul className="space-y-1">
                        {clients.map((client, index) => (
                            <li
                                key={client.id || index}
                                onClick={() => {
                                    if (client.id) {
                                        dispatch(setIsHistoryMode(true));
                                        dispatch(setActiveEngagementId(client.id.toString()));
                                        dispatch(setActiveClientName(client.client_name || null));
                                        navigate('/dashboard');
                                        if (setIsOpen) setIsOpen(false);
                                    }
                                }}
                            >
                                <div className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group ${activeEngagementId === client.id?.toString() ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}>
                                    <div className="flex items-center gap-1">
                                        <HiOutlineOfficeBuilding className={`w-5 h-5 mr-3 transition-colors ${activeEngagementId === client.id?.toString() ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        <span className="truncate">{client.client_name}</span>
                                    </div>
                                    <RiDeleteBin6Line 
                                        className="w-5 h-5 mr-3 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" 
                                        onClick={(e) => openDeleteModal(e, client.id?.toString() || '', client.client_name || '')}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiPlus className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-500">No clients found</p>
                    </div>
                )}
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-800" ref={profileRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${isProfileOpen ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                    >
                        <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mr-3 border border-indigo-500/30">
                            {user?.email ? user.email.charAt(0).toUpperCase() : <HiOutlineUserCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-200">
                                {user?.email?.split('@')?.[0] || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                        <HiOutlineChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer text-left"
                                >
                                    <HiOutlineLogout className="w-4 h-4 mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Modals */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={deleteLoading}
                title="Delete Client"
                message={`Are you sure you want to delete ${clientToDelete?.name}? All associated documents and chat history will be removed.`}
            />
        </div>
    );
}

export default Sidebar;
