import React, { useState } from 'react';
import { createClient } from '../api/chats';
import type { CreateClientData } from '../interface/chats';
import { useDispatch } from 'react-redux';
import { setActiveEngagementId, setActiveClientName, triggerRefreshClients, setIsHistoryMode } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';
import { HiOutlineX, HiOutlinePlus } from 'react-icons/hi';
import UploadDocumentsModal from './UploadDocumentsModal';

interface ClientModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function ClientModals({ isModalOpen, setIsModalOpen }: ClientModalsProps) {
  const dispatch = useDispatch();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentEngagementId, setCurrentEngagementId] = useState<string | null>(null);
  const [currentClientName, setCurrentClientName] = useState<string | null>(null);

  const [data, setData] = useState<CreateClientData>({
    client_name: '',
    period: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.client_name || !data.period) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await createClient(data);
      if (response.status === 200 || response.status === 201) {
        toast.success(response.data?.message || 'Client created successfully!');

        const newEngagementId = response.data?.engagement_id || response.data?.id;

        dispatch(triggerRefreshClients());

        if (newEngagementId) {
          setCurrentEngagementId(newEngagementId);
          setCurrentClientName(data.client_name);
          setIsModalOpen(false);
          setIsUploadModalOpen(true);
        } else {
          setIsModalOpen(false);
        }

        setData({ client_name: '', period: '' });
      } else {
        toast.error(response.data?.error || 'Failed to create client');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentEngagementId) {
      dispatch(setIsHistoryMode(false));
      dispatch(setActiveEngagementId(currentEngagementId));
      dispatch(setActiveClientName(currentClientName));
    }
    setIsUploadModalOpen(false);
    setCurrentEngagementId(null);
    setCurrentClientName(null);
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Client</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Add a client to start auditing</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <HiOutlineX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    className="block w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
                    value={data.client_name}
                    onChange={(e) => setData({ ...data, client_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Period</label>
                  <input
                    type="text"
                    placeholder="e.g. FY 2024"
                    className="block w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
                    value={data.period}
                    onChange={(e) => setData({ ...data, period: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-[1.5] py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer ${loading ? 'opacity-80' : ''}`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlinePlus className="w-5 h-5" />
                        <span>Create Client</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Documents Modal */}
      <UploadDocumentsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSkip={handleSkip}
        engagementId={currentEngagementId}
        clientName={currentClientName}
      />
    </>
  );
}
