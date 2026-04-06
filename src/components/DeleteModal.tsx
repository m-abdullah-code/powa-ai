import { createPortal } from 'react-dom';
import { HiOutlineExclamationCircle, HiOutlineX } from 'react-icons/hi';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Client",
  message = "Are you sure you want to delete this client? This action cannot be undone.",
  loading = false
}: DeleteModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-6 h-6 text-red-500" />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <HiOutlineX size={20} />
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer ${loading ? 'opacity-80' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Ok</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
