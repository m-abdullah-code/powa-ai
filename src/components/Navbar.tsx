import { IoMedicalOutline, IoMenuOutline } from 'react-icons/io5'

interface NavbarProps {
  onToggleSidebar: () => void;
}

function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <>
      <div className="px-6 h-full border-b border-gray-200 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <IoMenuOutline size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
              <IoMedicalOutline size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">MedAssist Pro</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Diagnosis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar;