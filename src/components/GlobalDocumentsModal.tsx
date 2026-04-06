import { useState, useEffect, useMemo } from 'react';
import { getGlobalDocuments } from '../api/chats';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineFolderOpen, HiOutlineSearch } from 'react-icons/hi';
import { FiX, FiRefreshCw } from 'react-icons/fi';

interface GlobalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalDocumentsModal({
  isOpen,
  onClose
}: GlobalDocumentsModalProps) {
  const [loading, setLoading] = useState(false);
  // const [deleting, setDeleting] = useState<string | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getGlobalDocuments();
      if (response.status === 200) {
        setDocuments(response.data?.documents || []);
      } else {
        toast.error('Failed to fetch global documents');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error('An error occurred while fetching documents');
    } finally {
      setLoading(false);
    }
  };

  // const handleDelete = async (docName: string) => {
  //   if (!window.confirm(`Are you sure you want to delete "${docName}"?`)) return;
    
  //   setDeleting(docName);
  //   try {
  //     // Note: The deleteGlobalDocument API currently clears ALL standards based on its URL /clear
  //     // If there's an endpoint for single document delete, it should be used here.
  //     // Assuming for now it clears all as per the 'clear' path name, or we just call the API.
  //     const response = await deleteGlobalDocument();
  //     if (response.status === 200 || response.status === 204) {
  //       toast.success('Document deleted successfully');
  //       fetchDocuments();
  //     } else {
  //       toast.error('Failed to delete document');
  //     }
  //   } catch (error: any) {
  //     toast.error('Failed to delete document');
  //   } finally {
  //     setDeleting(null);
  //   }
  // };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => 
      doc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-start bg-linear-to-b from-indigo-50/30 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <HiOutlineFolderOpen className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Global Standards</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium ml-13">Manage and access global audit documents</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 mb-6">
          <div className="relative group">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <HiOutlineDocumentText className="w-6 h-6 text-indigo-200" />
                </div>
              </div>
              <p className="text-slate-500 font-bold mt-6 animate-pulse">Organizing Standards...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 mx-auto">
                <HiOutlineDocumentText className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No documents found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                {searchQuery ? `We couldn't find any results for "${searchQuery}"` : "This library is currently empty."}
              </p>
              <button 
                onClick={() => {setSearchQuery(''); fetchDocuments();}}
                className="bg-white hover:bg-slate-50 text-indigo-600 font-bold py-3 px-6 rounded-2xl border border-indigo-100 shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh Library
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredDocuments.length} Available Documents</span>
              </div>
              {filteredDocuments.map((doc, index) => (
                <div 
                  key={index} 
                  className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-600/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 truncate">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
                      <HiOutlineDocumentText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="truncate pr-4">
                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors leading-tight mb-1">{doc}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Audit standard</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">PDF Document</span>
                        </div>
                    </div>
                  </div>
                  
                  {/* <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="Download Document"
                    >
                        <HiOutlineDownload className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        title="Delete Document"
                    >
                        {deleting === doc ? (
                             <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                            <HiOutlineTrash className="w-5 h-5" />
                        )}
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powa AI Document Library</p>
            <button
                onClick={onClose}
                className="py-3 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] cursor-pointer"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
}
