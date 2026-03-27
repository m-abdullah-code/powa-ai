import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex w-full">

            {/* Fixed Navbar */}
            <div className="fixed top-0 left-0 w-full z-50 h-19">
                <Navbar />
            </div>
            {/* Fixed Sidebar */}
            <div className={`fixed top-0 left-0 z-50 h-full transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-64'}`}>
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content (scrollable) */}
            <main className="lg:ml-64 flex-1 min-h-screen bg-gray-50 p-6 px-5 sm:px-6 pt-13 lg:pt-19">
                {children}
            </main>
        </div>
    );
};

export default Layout;