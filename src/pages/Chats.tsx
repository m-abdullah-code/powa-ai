import React, { useEffect, useRef, useState } from "react";
import { IoSend, IoDownloadOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  addMessage,
  updateOrAddHistory,
  setCurrentSessionId
} from "../store/slices/chatSlice";
import { chats, pdfGenerate } from "../api/chats";
import type {
  ChatMessage,
} from "../interface/chats";
import Specialist from "../components/Specialist";

interface SpecialistData {
  image: string;
  name: string;
  specialty: string;
  location: string;
  profileUrl: string;
}

const parseSpecialists = (content: string): { intro: string; specialists: SpecialistData[]; outro: string } => {
  const specialists: SpecialistData[] = [];
  const parts = content.split(/### 🩺 Specialist \d+/);

  if (parts.length <= 1) {
    return { intro: content, specialists: [], outro: "" };
  }

  const intro = parts[0].trim();
  let outro = "";
  const specialistChunks = parts.slice(1);

  specialistChunks.forEach((chunk, index) => {
    let cleanChunk = chunk;

    // If it's the last chunk, extract the outro
    if (index === specialistChunks.length - 1) {
      const outroMarker = "Would you like";
      const markerIndex = cleanChunk.indexOf(outroMarker);
      if (markerIndex !== -1) {
        outro = cleanChunk.substring(markerIndex).trim();
        cleanChunk = cleanChunk.substring(0, markerIndex).trim();
      }
    }

    const name = cleanChunk.match(/\*\*Name:\*\* (.*?)(?:\n|$)/)?.[1]?.trim();
    const imageMatch = cleanChunk.match(/Image(?:\sURL)?:\s*(.*?)(?:\n|$)/i);
    const image = imageMatch ? imageMatch[1].replace(/\*/g, "").trim() : "";
    const specialty = cleanChunk.match(/\*\*Specialty:\*\* (.*?)(?:\n|$)/)?.[1]?.trim();
    const location = cleanChunk.match(/\*\*Location:\*\* (.*?)(?:\n|$)/)?.[1]?.trim();
    const profileUrl = cleanChunk.match(/\*\*Profile URL:\*\* (.*?)(?:\n|$)/)?.[1]?.trim();

    if (name) {
      specialists.push({
        name,
        image: image || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
        specialty: specialty || "",
        location: location || "",
        profileUrl: profileUrl || ""
      });
    }
  });

  return { intro, specialists, outro };
};

const Chats = () => {
  const dispatch = useDispatch();
  const { allSessions, currentSessionId } = useSelector((state: RootState) => state.chat);

  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = allSessions[currentSessionId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Always generate new sessionId on mount if not already set (e.g. from history click)
  useEffect(() => {
    if (!currentSessionId) {
      const newSessionId = crypto.randomUUID();
      dispatch(setCurrentSessionId(newSessionId));
    }
  }, []); // Only run once on mount

  // 📂 PDF GENERATION & DOWNLOAD
  const handleDownloadPDF = async () => {
    if (!currentSessionId) return;
    try {
      const response = await pdfGenerate(currentSessionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Referral_${currentSessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  // 🟢 SEND MESSAGE
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loadingChat) return;

    const sessionId = currentSessionId;
    const tempUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    // Add user message to Redux
    dispatch(addMessage({ sessionId, message: tempUserMessage }));
    setInput("");
    setLoadingChat(true);

    try {
      const res = await chats({
        message: tempUserMessage.content,
        session_id: sessionId || "",
      });
      const data = res.data;
      const content = typeof data === "string" ? data : (data.content || data.message || "");

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: content,
        created_at: new Date().toISOString(),
      };

      // Add assistant message to Redux
      dispatch(addMessage({ sessionId, message: assistantMessage }));

      // Update history title if this is a new session
      dispatch(updateOrAddHistory({
        sessionId,
        title: tempUserMessage.content
      }));

    } catch (err) {
      console.error("Chat API error", err);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex bg-white h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] rounded-3xl shadow-2xl shadow-green-50/50 border border-gray-100 overflow-hidden mt-6 lg:mt-2">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 custom-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700 p-4">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] bg-linear-to-br from-green-600 to-indigo-700 shadow-2xl shadow-green-200 flex items-center justify-center text-white mb-6 md:mb-8 group transition-transform hover:scale-105">
                <IoSend size={30} className="-rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform md:hidden" />
                <IoSend size={40} className="-rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform hidden md:block" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">Your Medical Assistant</h3>
              <p className="text-gray-500 max-w-sm text-xs md:text-sm font-medium leading-relaxed">
                Connect with our AI specialized in medical analysis. Ask anything about symptoms, drugs, or health advice.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const { intro, specialists, outro } = msg.role === "assistant" ? parseSpecialists(msg.content) : { intro: msg.content, specialists: [], outro: "" };
              const hasSpecialists = specialists.length > 0;

              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group animate-in slide-in-from-bottom-5 fade-in duration-500`}
                >
                  <div
                    className={`relative px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl max-w-[95%] md:max-w-[85%] text-sm md:text-[15px] leading-relaxed shadow-sm transition-all border ${msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-none shadow-green-200 border-green-500"
                      : "bg-gray-50 text-gray-800 rounded-tl-none border-gray-100"
                      }`}
                  >
                    {hasSpecialists ? (
                      <div className="space-y-4">
                        {intro && <p className="font-medium">{intro}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {specialists.map((spec, idx) => (
                            <Specialist key={idx} {...spec} />
                          ))}
                        </div>

                        {outro && <p className="font-medium">{outro}</p>}

                        {(outro.toLowerCase().includes("referral letter") || outro.toLowerCase().includes("download pdf") || msg.content.toLowerCase().includes("referral letter")) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={handleDownloadPDF}
                              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-lg shadow-green-200 text-sm font-bold group/btn"
                            >
                              <IoDownloadOutline size={20} className="group-hover/btn:translate-y-0.5 transition-transform" />
                              Download Referral Letter
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                        {(msg.content.toLowerCase().includes("referral letter") || msg.content.toLowerCase().includes("download pdf")) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={handleDownloadPDF}
                              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-lg shadow-green-200 text-sm font-bold group/btn"
                            >
                              <IoDownloadOutline size={20} className="group-hover/btn:translate-y-0.5 transition-transform" />
                              Download Referral Letter
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`mt-2 text-[10px] font-bold uppercase tracking-widest opacity-80 ${msg.role === "user" ? "text-right" : ""}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {loadingChat && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-gray-50 px-6 py-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-white/50 backdrop-blur-sm border-t border-gray-50">
          <form
            onSubmit={handleSend}
            className="relative flex items-center max-w-4xl mx-auto w-full group"
          >
            <input
              type="text"
              autoFocus
              placeholder="Ask MedAssist AI..."
              className="w-full pl-6 pr-14 md:pr-16 py-4 md:py-5 bg-gray-50 border border-gray-200 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-green-100 focus:border-green-400 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-semibold text-gray-700 shadow-sm text-sm md:text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loadingChat}
            />
            <button
              type="submit"
              disabled={loadingChat || !input.trim()}
              className="absolute right-2 p-3 md:p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white rounded-xl md:rounded-2xl transition-all shadow-xl shadow-green-200 active:scale-95 disabled:shadow-none"
            >
              <IoSend size={18} className={`md:hidden ${loadingChat ? "animate-pulse" : ""}`} />
              <IoSend size={22} className={`hidden md:block ${loadingChat ? "animate-pulse" : ""}`} />
            </button>
          </form>
          <div className="mt-3 md:mt-4 flex items-center justify-center gap-4">
            <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] md:tracking-[0.3em]">Confidential Medical AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;
