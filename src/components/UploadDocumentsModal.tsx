import React, { useState } from 'react';
import { uploadDocuments, globalUploadDocuments } from '../api/chats';
import { useDispatch } from 'react-redux';
import { setIsHistoryMode, setActiveEngagementId, setActiveClientName } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';
import { HiOutlineCloudUpload, HiOutlineDocumentText } from 'react-icons/hi';
import { FiX } from 'react-icons/fi';

interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
  engagementId: string | null;
  clientName: string | null;
  isGlobal?: boolean;
}

export default function UploadDocumentsModal({
  isOpen,
  onClose,
  onSkip,
  engagementId,
  clientName,
  isGlobal = false
}: UploadDocumentsModalProps) {
  const dispatch = useDispatch();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  if (!isOpen) return null;

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
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!isGlobal && !engagementId) {
      toast.error('Engagement ID is required for client document upload');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('file', file);
    });

    if (!isGlobal) {
      formData.append('id', '0');
      formData.append('filename', selectedFiles[0].name);
      formData.append('status', 'uploaded');
      formData.append('engagement_id', engagementId!);
      if (clientName) {
        formData.append('client_name', clientName);
      }
    }

    setUploadLoading(true);
    try {
      const response = isGlobal 
        ? await globalUploadDocuments(formData)
        : await uploadDocuments(engagementId!, formData);

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        toast.success(isGlobal ? 'Global documents uploaded successfully!' : 'Documents uploaded successfully!');
        if (!isGlobal && engagementId) {
            dispatch(setIsHistoryMode(false));
            dispatch(setActiveEngagementId(engagementId));
            dispatch(setActiveClientName(clientName));
        }
        setSelectedFiles([]);
        onClose();
      } else {
        toast.error(response.data?.error || 'Failed to upload documents');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadLoading(false);
    }
  };

  const internalOnSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isGlobal ? 'Upload Global Documents' : 'Upload Documents'}
              </h2>
              {isGlobal ? (
                <p className="text-sm text-slate-500 mt-1 font-medium italic">These documents will be available for all clients</p>
              ) : (
                <p className="text-sm text-slate-500 mt-1 font-medium">Client: <span className="text-indigo-600">{clientName}</span></p>
              )}
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

            <div className="pt-4 border-t border-slate-50 flex gap-2">
              <button
                type="button"
                onClick={internalOnSkip}
                className="py-4 px-8 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl shadow-lg shadow-slate-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
              >
                {onSkip ? 'Skip' : 'Cancel'}
              </button>
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
  );
}
