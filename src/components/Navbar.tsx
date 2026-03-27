
function Navbar() {
  return (
    <div className="h-full border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          POWA AI
        </h1>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
      </div>

    </div>
  )
}

export default Navbar;
