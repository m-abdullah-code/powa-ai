import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { workpapersChat, getWorkpapersChat } from '../api/chats';
import type { ChatMessage } from '../interface/chats';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import toast from 'react-hot-toast';
import ClientModals from '../components/ClientModals';
import { HiOutlinePlus } from 'react-icons/hi';
import { FiMessageSquare, FiSend, FiInbox, FiDownload } from 'react-icons/fi';

const WorkpaperContent = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const firstLine = lines[0]?.trim() || 'Workpaper-Report';
    const fileName = `${firstLine.replace(/[|\\/:*?"<>]/g, '_')}.pdf`;

    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Audit Workpaper Report", margin, y);
    y += 15;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        y += 5;
        return;
      }

      const headers = [
        'Objective', 'Criteria', 'Procedures Performed', 
        'Evidence Obtained', 'Results and Findings', 
        'Overall Assessment', 'Conclusion', 'Follow-Up Items'
      ];
      
      const isHeader = headers.some(h => trimmedLine.startsWith(h) && trimmedLine.length < h.length + 5);
      const isMainHeader = trimmedLine.startsWith('WORKPAPER:');
      
      if (isMainHeader) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229); // indigo-600
      } else if (isHeader) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42); // slate-900
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // slate-600
      }

      const splitText = doc.splitTextToSize(line, maxWidth);
      
      // Check if we need a new page
      if (y + (splitText.length * 7) > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(splitText, margin, y);
      y += (splitText.length * 7);
    });

    doc.save(fileName);
    toast.success('Report downloaded as PDF');
  };

  return (
    <div className="space-y-4 relative group/content">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        const headers = [
          'Objective', 'Criteria', 'Procedures Performed', 
          'Evidence Obtained', 'Results and Findings', 
          'Overall Assessment', 'Conclusion', 'Follow-Up Items'
        ];
        
        const isHeader = headers.some(h => trimmedLine.startsWith(h) && trimmedLine.length < h.length + 5);
        const isMainHeader = trimmedLine.startsWith('WORKPAPER:');
        const isClientPeriod = trimmedLine.includes('|') && index === 0;

        if (isClientPeriod) {
          return (
            <div key={index} className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold mb-2 border-b border-indigo-50 pb-2">
              {line}
            </div>
          );
        }

        if (isMainHeader) {
          return (
            <h2 key={index} className="text-xl font-black text-slate-900 border-l-4 border-indigo-600 pl-4 my-6">
              {line}
            </h2>
          );
        }

        if (isHeader) {
          return (
            <h3 key={index} className="text-sm font-bold text-slate-900 mt-6 mb-3 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 shadow-sm shadow-indigo-200"></span>
              {line}
            </h3>
          );
        }

        if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('-')) {
          return (
            <div key={index} className="pl-5 text-sm text-slate-600 leading-relaxed py-1 flex">
              <span className="mr-3 text-indigo-400 font-bold shrink-0">
                {trimmedLine.startsWith('-') ? '•' : trimmedLine.split('.')[0] + '.'}
              </span>
              <span className="font-medium">
                {renderBoldText(trimmedLine.replace(/^\d+\.\s*|-\s*/, ''))}
              </span>
            </div>
          );
        }

        if (trimmedLine === '') return <div key={index} className="h-3" />;

        return (
          <p key={index} className="text-sm text-slate-600 font-medium leading-relaxed">
            {renderBoldText(line)}
          </p>
        );
      })}
      
      <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs"
        >
          <FiDownload className="w-4 h-4" />
          <span>Download Report (PDF)</span>
        </button>
      </div>
    </div>
  );
};

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

function Dashboard() {
  const activeEngagementId = useSelector((state: RootState) => state.chat.activeEngagementId);
  const isHistoryMode = useSelector((state: RootState) => state.chat.isHistoryMode);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Reset chat and fetch history when switching clients
  useEffect(() => {
    setChatMessages([]);
    if (activeEngagementId) {
        if (!isHistoryMode) {
            return;
        }

        const fetchHistory = async () => {
            setIsChatLoading(true);
            try {
                const response = await getWorkpapersChat(activeEngagementId);
                let chatData = null;
                
                if (response.status === 200) {
                    if (Array.isArray(response.data)) {
                        chatData = response.data;
                    } else if (response.data && Array.isArray(response.data.data)) {
                        chatData = response.data.data;
                    }
                }

                if (chatData) {
                    const history = chatData.map((msg: any) => ([
                        {
                            text: msg.user_query || 'Unknown query',
                            isUser: true,
                            timestamp: msg.created_at
                        },
                        {
                            text: msg.content || '...',
                            isUser: false,
                            timestamp: msg.created_at
                        }
                    ])).flat();
                    
                    if (history.length > 0) {
                        setChatMessages(history);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
                toast.error("Failed to load chat history");
            } finally {
                setIsChatLoading(false);
            }
        };
        fetchHistory();
    }
  }, [activeEngagementId, isHistoryMode]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeEngagementId) return;

    const userInput = chatInput;
    const newUserMsg: ChatMessage = { text: userInput, isUser: true };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
        const response = await workpapersChat({ 
            engagement_id: activeEngagementId, 
            user_query: userInput 
        });
        
        let answerText = "No response received";
        if (response.data && response.data.content) {
            answerText = response.data.content;
        }
        
        const aiMsg: ChatMessage = { text: answerText, isUser: false };
        setChatMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
        let errorMsg = 'Failed to send message';
        if (error.response?.data?.detail) {
            errorMsg = Array.isArray(error.response.data.detail) ? error.response.data.detail[0].msg : error.response.data.detail;
        } else if (error.response?.data?.error) {
            errorMsg = error.response.data.error;
        }
        toast.error(errorMsg);
    } finally {
        setIsChatLoading(false);
    }
  };

  return (
    <div className="p-6 pb-0 flex flex-col h-full max-h-screen bg-slate-50/50">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and analyze your client workpapers</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] cursor-pointer flex items-center space-x-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          <span>New Client</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeEngagementId ? (
          <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-0 mb-6 max-h-[calc(100vh-150px)]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar">
                  {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                            <FiMessageSquare className="w-10 h-10 text-indigo-200" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to Audit?</h3>
                          <p className="max-w-xs text-center text-slate-500 font-medium">Start chatting with the AI about your workpapers.</p>
                      </div>
                  ) : (
                      chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                              <div className={`max-w-[85%] rounded-3xl px-6 py-4 ${msg.isUser ? 'bg-indigo-600 text-white rounded-br-md shadow-lg shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-md shadow-sm'}`}>
                                  {msg.isUser ? (
                                      <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">{msg.text}</p>
                                  ) : (
                                      <WorkpaperContent text={msg.text} />
                                  )}
                              </div>
                          </div>
                      ))
                  )}
                  {isChatLoading && (
                      <div className="flex justify-start">
                          <div className="bg-white border border-slate-100 text-indigo-400 rounded-3xl rounded-tl-md px-6 py-4 shadow-sm flex space-x-2 items-center">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-slate-50 shrink-0">
                  <form onSubmit={handleChatSubmit} className="flex space-x-4 w-full relative">
                      <input 
                          type="text" 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)} 
                          placeholder="Ask a question about the workpapers..." 
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                          disabled={isChatLoading}
                      />
                      <button 
                          type="submit" 
                          disabled={!chatInput.trim() || isChatLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer"
                      >
                          <FiSend className={`w-6 h-6 transition-transform ${chatInput.trim() && !isChatLoading ? 'rotate-12 translate-x-0.5' : ''}`} />
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 min-h-0 mb-6 group transition-all hover:bg-white hover:border-indigo-200">
              <div className="text-center p-12">
                  <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <FiInbox className="w-12 h-12 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Select a Client</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto">Choose a client from the sidebar to start auditing their documents with AI.</p>
              </div>
          </div>
      )}

      {/* Modals Component */}
      <ClientModals isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />

    </div>
  );
}

export default Dashboard;
