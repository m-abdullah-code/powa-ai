import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex w-full min-h-screen">
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Fixed Navbar */}
            <div className="fixed top-0 left-0 w-full z-40 h-19">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50 flex flex-col pt-19">
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;