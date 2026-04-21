import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import { workpapersChat, getWorkpapersChat } from '../api/chats';
import type { ChatMessage } from '../interface/chats';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import toast from 'react-hot-toast';
import ClientModals from '../components/ClientModals';
import UploadDocumentsModal from '../components/UploadDocumentsModal';
import GlobalDocumentsModal from '../components/GlobalDocumentsModal';
import { HiOutlinePlus, HiOutlineOfficeBuilding, HiOutlineFolderOpen } from 'react-icons/hi';
import { FiMessageSquare, FiSend, FiInbox, FiDownload } from 'react-icons/fi';

const WorkpaperContent = ({ text, isStructured }: { text: string; isStructured?: boolean }) => {
  const lines = text.split('\n');
  
const handleDownloadPDF = () => {
  // ── Sanitize text to fix jsPDF special-char escaping bug ──────────
  // jsPDF adds a stray `/` before characters like %, (, ), . when they
  // appear after certain tokens. Normalize the string first.
  const sanitize = (raw: string): string =>
    raw
      .replace(/\*\*/g, '')                     // strip markdown bold
      .replace(/[\u2010-\u2015\u2212]/g, '-')   // all dash variants → hyphen-minus
      .replace(/\u2019|\u2018/g, "'")            // curly quotes → straight
      .replace(/\u201C|\u201D/g, '"')            // curly double quotes → straight
      .replace(/\u2026/g, '...')                 // ellipsis char
      .replace(/\u00A0/g, ' ')                   // non-breaking space
      .replace(/[^\x00-\x7F]/g, (c) => {        // any remaining non-ASCII
        // keep common latin extended; strip everything else
        return c.charCodeAt(0) < 256 ? c : '';
      });

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();   // 595.28
  const pageH  = doc.internal.pageSize.getHeight();  // 841.89
  const marginL = 52;
  const marginR = 52;
  // Use a conservative content width — jsPDF glyph-width estimation
  // is imprecise; the 18pt safety margin prevents mid-word truncation.
  const contentW = pageW - marginL - marginR - 18;   // ~473 pt
  let y = 0;
  let pageNum = 1;

  const COLORS = {
    navy:       [45, 58, 140]   as [number, number, number],
    navyLight:  [240, 243, 255] as [number, number, number],
    navyBorder: [212, 217, 245] as [number, number, number],
    text:       [26, 26, 46]    as [number, number, number],
    textMid:    [55, 55, 75]    as [number, number, number],
    textLight:  [140, 140, 155] as [number, number, number],
    ruleLine:   [220, 225, 245] as [number, number, number],
  };

  const SECTION_HEADERS = [
    'Objective', 'Criteria', 'Procedures Performed',
    'Evidence Obtained', 'Results and Findings',
    'Overall Assessment', 'Conclusion', 'Follow-Up Items',
  ];

  const LINE_H = 14;   // body line height in pt

  const addFooter = () => {
    doc.setDrawColor(...COLORS.ruleLine);
    doc.setLineWidth(0.5);
    doc.line(marginL, pageH - 38, pageW - marginR, pageH - 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Confidential - For Audit Use Only', marginL, pageH - 24);
    doc.text(`Page ${pageNum}`, pageW - marginR, pageH - 24, { align: 'right' });
  };

  const ensurePage = (neededH: number) => {
    if (y + neededH > pageH - 56) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = 52;
    }
  };

  // ── Page 1 Header ────────────────────────────────────────────────
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageW, 7, 'F');

  y = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...COLORS.text);
  doc.text('Audit Workpaper Report', marginL, y);

  const firstLine = sanitize(lines[0]?.trim() || '');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textLight);
  if (firstLine) doc.text(firstLine, pageW - marginR, y - 12, { align: 'right' });
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(`Generated ${dateStr}`, pageW - marginR, y + 5, { align: 'right' });

  y += 16;
  doc.setDrawColor(...COLORS.navy);
  doc.setLineWidth(1.5);
  doc.line(marginL, y, pageW - marginR, y);
  y += 22;

  // ── Body parsing ─────────────────────────────────────────────────
  const bodyLines = firstLine && lines[0]?.trim().includes('|') ? lines.slice(1) : lines;
  let inConclusion = false;
  const conclusionBuf: string[] = [];

  const flushConclusion = () => {
    if (!conclusionBuf.length) return;
    const txt = sanitize(conclusionBuf.join(' ').trim());
    const wrapped = doc.splitTextToSize(txt, contentW - 36);
    const blockH = wrapped.length * LINE_H + 38;
    ensurePage(blockH);

    doc.setFillColor(...COLORS.navyLight);
    doc.setDrawColor(...COLORS.navyBorder);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginL, y, contentW + 18, blockH, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.navy);
    doc.setCharSpace(1.5);
    doc.text('CONCLUSION', marginL + 16, y + 17);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.textMid);
    doc.text(wrapped, marginL + 16, y + 31);

    y += blockH + 18;
    conclusionBuf.length = 0;
    inConclusion = false;
  };

  for (const rawLine of bodyLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) { y += 6; continue; }
    const clean = sanitize(trimmed);

    // WORKPAPER: banner
    if (clean.startsWith('WORKPAPER:')) {
      flushConclusion();
      const wrapped = doc.splitTextToSize(clean, contentW - 28);
      const bannerH = wrapped.length * LINE_H + 22;
      ensurePage(bannerH);

      doc.setFillColor(...COLORS.navyLight);
      doc.rect(marginL, y, contentW + 18, bannerH, 'F');
      doc.setFillColor(...COLORS.navy);
      doc.rect(marginL, y, 5, bannerH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.navy);
      doc.text(wrapped, marginL + 16, y + 15);
      y += bannerH + 18;
      continue;
    }

    // Section headers
    const matchedHeader = SECTION_HEADERS.find(
      (h) => clean.startsWith(h) && clean.length < h.length + 5
    );
    if (matchedHeader) {
      flushConclusion();
      inConclusion = matchedHeader === 'Conclusion';
      if (inConclusion) continue;

      ensurePage(30);
      y += 8;
      doc.setDrawColor(...COLORS.ruleLine);
      doc.setLineWidth(0.5);
      doc.line(marginL, y, pageW - marginR, y);
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.navy);
      doc.setCharSpace(1.4);
      doc.text(clean.toUpperCase(), marginL, y);
      doc.setCharSpace(0);
      y += 14;
      continue;
    }

    if (inConclusion) { conclusionBuf.push(clean); continue; }

    // Numbered list: "1. text" or bullet "- text"  
    const numMatch  = clean.match(/^(\d+)\.\s+([\s\S]*)/);
    const dashMatch = clean.match(/^[-•]\s+([\s\S]*)/);

    if (numMatch || dashMatch) {
      const bullet   = numMatch ? `${numMatch[1]}.` : '-';
      const itemText = numMatch ? numMatch[2] : dashMatch![1];
      // Use narrower width for list items (bullet takes ~24pt)
      const wrapped  = doc.splitTextToSize(itemText, contentW - 24);
      const itemH    = wrapped.length * LINE_H + 4;
      ensurePage(itemH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.navy);
      doc.text(bullet, marginL + 4, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.textMid);
      doc.text(wrapped, marginL + 24, y);
      y += itemH + 3;
      continue;
    }

    // Regular paragraph
    const wrapped = doc.splitTextToSize(clean, contentW);
    const textH   = wrapped.length * LINE_H;
    ensurePage(textH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.textMid);
    doc.text(wrapped, marginL, y);
    y += textH + 8;
  }

  flushConclusion();
  addFooter();

  const safeName = sanitize(lines[0]?.trim() || 'Workpaper-Report')
    .replace(/[|\\/:*?"<>]/g, '_');
  doc.save(`${safeName}.pdf`);
  toast.success('Report downloaded as PDF');
};

  const tokens = marked.lexer(text);

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
      
      {isStructured && (
        <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Report (PDF)</span>
          </button>
        </div>
      )}
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
  const activeClientName = useSelector((state: RootState) => state.chat.activeClientName);
  const isHistoryMode = useSelector((state: RootState) => state.chat.isHistoryMode);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGlobalUpload, setIsGlobalUpload] = useState(false);
  const [isGlobalDocsModalOpen, setIsGlobalDocsModalOpen] = useState(false);

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
                            timestamp: msg.created_at,
                            is_structured_audit_output: msg.is_structured_audit_output
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
        
        const aiMsg: ChatMessage = { 
            text: answerText, 
            isUser: false,
            is_structured_audit_output: response.data?.is_structured_audit_output 
        };
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
    <div className="p-4 sm:p-6 pb-0 flex flex-col h-full max-h-screen bg-slate-50/50">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 shrink-0">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Audit Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage and analyze your client workpapers</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 sm:h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] cursor-pointer flex items-center space-x-2 text-sm sm:text-base whitespace-nowrap"
          >
            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Client</span>
          </button>
          
          <div className="flex items-center h-10 sm:h-12 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-0.5 sm:p-1 gap-0.5 sm:gap-1">
            <button
              onClick={() => {
                setIsGlobalUpload(true);
                setIsUploadModalOpen(true);
              }}
              className="h-full px-2 sm:px-4 hover:bg-indigo-50 text-indigo-600 font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-sm whitespace-nowrap"
              title="Upload Global Documents"
            >
              <HiOutlinePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Upload Global</span>
            </button>
            <div className="w-px h-5 sm:h-6 bg-slate-100 mx-0.5"></div>
            <button
              onClick={() => setIsGlobalDocsModalOpen(true)}
              className="h-full px-2 sm:px-4 hover:bg-indigo-50 text-indigo-600 font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-sm whitespace-nowrap"
              title="View Global Documents"
            >
              <HiOutlineFolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Global</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeEngagementId ? (
          <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-0 max-h-[calc(100vh-150px)] animate-in zoom-in-95 duration-200">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <HiOutlineOfficeBuilding className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                          <h3 className="text-sm font-bold text-slate-900">{activeClientName || 'Audit Session'}</h3>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Active Audit Room</p>
                      </div>
                  </div>
              </div>

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
                                      <WorkpaperContent text={msg.text} isStructured={msg.is_structured_audit_output} />
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
                      <div className="relative flex-1">
                          <button
                              type="button"
                              onClick={() => {
                                setIsGlobalUpload(false);
                                setIsUploadModalOpen(true);
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors cursor-pointer z-10"
                              title="Upload Document"
                          >
                            <HiOutlinePlus className="w-5 h-5" />
                          </button>
                          <input 
                              type="text" 
                              value={chatInput} 
                              onChange={(e) => setChatInput(e.target.value)} 
                              placeholder="Ask a question about the workpapers..." 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                              disabled={isChatLoading}
                          />
                      </div>
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
      
      {/* Upload Documents Modal (Direct Trigger) */}
      <UploadDocumentsModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          engagementId={activeEngagementId}
          clientName={activeClientName}
          isGlobal={isGlobalUpload}
      />
      <GlobalDocumentsModal
          isOpen={isGlobalDocsModalOpen}
          onClose={() => setIsGlobalDocsModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
