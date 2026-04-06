
import { HiOutlineMenuAlt2 } from 'react-icons/hi';

function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <div className="h-full border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer lg:hidden"
        >
          <HiOutlineMenuAlt2 className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          POWA AI
        </h1>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
      </div>

    </div>
  )
}

export default Navbar;
