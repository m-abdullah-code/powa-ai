import React, { useState } from 'react';
import { createClient, uploadDocuments } from '../api/chats';
import type { CreateClientData } from '../interface/chats';
import { useDispatch } from 'react-redux';
import { setActiveEngagementId, triggerRefreshClients, setIsHistoryMode } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';
import { HiOutlineX, HiOutlineCloudUpload, HiOutlineDocumentText, HiOutlinePlus } from 'react-icons/hi';
import { FiX } from 'react-icons/fi';

interface ClientModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function ClientModals({ isModalOpen, setIsModalOpen }: ClientModalsProps) {
  const dispatch = useDispatch();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currentEngagementId, setCurrentEngagementId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !currentEngagementId) {
        toast.error('Please select at least one file to upload');
        return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
        formData.append('file', file);
    });
    formData.append('id', '0');
    formData.append('filename', selectedFiles[0].name); 
    formData.append('status', 'uploaded');
    formData.append('engagement_id', currentEngagementId);
    if (currentClientName) {
        formData.append('client_name', currentClientName);
    }

    setUploadLoading(true);
    try {
        const response = await uploadDocuments(currentEngagementId, formData);
        if (response.status === 200 || response.status === 201 || response.status === 202) {
            toast.success('Documents uploaded successfully!');
            dispatch(setIsHistoryMode(false));
            dispatch(setActiveEngagementId(currentEngagementId));
            setIsUploadModalOpen(false);
            setSelectedFiles([]);
            setCurrentEngagementId(null);
            setCurrentClientName(null);
        } else {
            toast.error(response.data?.error || 'Failed to upload documents');
        }
    } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
        setUploadLoading(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Documents</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Client: <span className="text-indigo-600">{currentClientName}</span></p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 hover:border-indigo-300 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <HiOutlineCloudUpload className="w-6 h-6 text-indigo-500" />
                            </div>
                            <p className="mb-1 text-sm text-slate-600 font-bold">Click to upload documents</p>
                            <p className="text-xs text-slate-400 font-medium italic">Supports PDF, DOC, DOCX</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} multiple required />
                    </label>
                </div>

                {selectedFiles.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="text-sm text-slate-700 flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors group">
                                <div className="flex items-center gap-3 truncate">
                                    <HiOutlineDocumentText className="w-5 h-5 text-indigo-500 shrink-0" />
                                    <span className="truncate font-semibold">{file.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50">
                  <button
                    type="submit"
                    disabled={uploadLoading || selectedFiles.length === 0}
                    className={`w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer ${(uploadLoading || selectedFiles.length === 0) ? 'opacity-80' : ''}`}
                  >
                    {uploadLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Uploading Files...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCloudUpload className="w-6 h-6" />
                        <span>Confirm and Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
