import React, { useEffect, useRef, useState } from "react";
import { IoSend, IoDownloadOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  addMessage,
  updateOrAddHistory,
  setCurrentSessionId
} from "../store/slices/chatSlice";
import { chats, generateReferral, uploadFile } from "../api/chats";
import type {
  ChatMessage,
} from "../interface/chats";
import Specialist from "../components/Specialist";
import { generateUUID } from "../utils/uuid";
import { MdOutlineFileUpload } from "react-icons/md";

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
  const [isUploadEnabled, setIsUploadEnabled] = useState(false);
  const [showReferralButton, setShowReferralButton] = useState(false);
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
      const newSessionId = generateUUID();
      dispatch(setCurrentSessionId(newSessionId));
      setShowReferralButton(false);
    }
  }, []); // Only run once on mount

  // REFERRAL GENERATION & DOWNLOAD
  const handleDownloadReferral = async () => {
    if (!currentSessionId) return;
    try {
      const response = await generateReferral(currentSessionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Referral_${currentSessionId}.docx`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Referral download failed", err);
    }
  };

  // Check if upload should be enabled
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.content.includes("Please upload the patient's medical history")) {
        setIsUploadEnabled(true);
      } else {
        setIsUploadEnabled(false);
      }
    } else {
      setIsUploadEnabled(false);
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentSessionId) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingChat(true);
      await uploadFile(currentSessionId, formData);

      // Add file upload message to chat history
      const fileMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: `Uploaded: ${file.name}`,
        created_at: new Date().toISOString(),
      };
      dispatch(addMessage({ sessionId: currentSessionId, message: fileMessage }));

      // Show referral button immediately after upload
      setShowReferralButton(true);

      // setInput("File uploaded successfully.");

      // Reset file input
      e.target.value = "";

      setIsUploadEnabled(false); // Disable after upload?

    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setLoadingChat(false);
    }
  };

  // SEND MESSAGE
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
    setShowReferralButton(false);
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
    <div className="flex bg-white h-[calc(100vh-140px)] lg:h-[calc(100vh-118px)] rounded-3xl shadow-2xl shadow-green-50/50 border border-gray-100 overflow-hidden mt-6 lg:mt-2">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white pb-4">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 scroll-smooth
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        ">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700 p-4 m-0">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] bg-linear-to-br from-green-600 to-green-700 shadow-2xl shadow-green-200 flex items-center justify-center text-white mb-6 md:mb-8 group transition-transform hover:scale-105">
                <IoSend size={30} className="-rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform md:hidden" />
                <IoSend size={40} className="-rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform hidden md:block" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">Your Medical & Referral Assistant</h3>
              <p className="text-gray-500 max-w-md text-xs md:text-sm font-medium leading-relaxed">
                AI-powered medical assistant for symptom guidance, referral pathways, specialist information, and referral letter generation.
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
                    className={`relative px-4 py-1 md:px-6 md:py-2 rounded-xl md:rounded-2xl max-w-[95%] md:max-w-[85%] text-sm md:text-[15px] leading-relaxed shadow-sm transition-all border ${msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-none shadow-green-200 border-green-500"
                      : "bg-gray-50 text-gray-800 rounded-tl-none border-gray-100"
                      }`}
                  >
                    {hasSpecialists ? (
                      <div className="space-y-4">
                        {intro && <p className="font-medium">{intro.replace("[[REFERRAL_READY]]", "").trim()}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {specialists.map((spec, idx) => (
                            <Specialist key={idx} {...spec} />
                          ))}
                        </div>

                        {outro && <p className="font-medium">{outro.replace("[[REFERRAL_READY]]", "").trim()}</p>}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-medium whitespace-pre-wrap">{msg.content.replace("[[REFERRAL_READY]]", "").replace("PDF", "Word").trim()}</p>
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
          {showReferralButton && (
            <div className="flex justify-start animate-in slide-in-from-bottom-5 fade-in duration-500">
              <div className="bg-gray-50 px-6 py-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm space-y-4 max-w-[85%]">
                <p className="text-gray-800 text-sm md:text-[15px] font-medium leading-relaxed">
                  Your referral letter is ready for download.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDownloadReferral}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-lg shadow-green-200 text-sm font-bold group/btn cursor-pointer"
                  >
                    <IoDownloadOutline size={20} className="group-hover/btn:translate-y-0.5 transition-transform" />
                    Download Referral Letter
                  </button>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 pb-0 md:pb-0 bg-white/50 backdrop-blur-sm border-t border-gray-50">
          <form
            onSubmit={handleSend}
            className="relative flex items-center max-w-4xl mx-auto w-full group"
          >

            <input
              type="file"
              className="hidden"
              id="file-upload"
              disabled={!isUploadEnabled}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
            />
            <label
              htmlFor={isUploadEnabled ? "file-upload" : undefined}
              className={`absolute left-2 
                ${isUploadEnabled
                  ? "cursor-pointer hover:text-green-600"
                  : "opacity-40 cursor-not-allowed pointer-events-none"}
              `}
            >
              <MdOutlineFileUpload size={25} className="text-gray-500" />
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ask MediAssist AI..."
              className="w-full pl-10 pr-14 md:pr-16 py-2 md:py-5 bg-gray-50 border border-gray-200 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-green-100 focus:border-green-400 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 shadow-sm text-sm md:text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loadingChat}
            />
            <button
              type="submit"
              disabled={loadingChat || !input.trim()}
              className="absolute right-2 p-2 md:p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white rounded-xl md:rounded-2xl transition-all shadow-xl shadow-green-200 active:scale-95 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              <IoSend size={18} className={`md:hidden ${loadingChat ? "animate-pulse" : ""}`} />
              <IoSend size={22} className={`hidden md:block ${loadingChat ? "animate-pulse" : ""}`} />
            </button>
          </form>
          {/* <div className="mt-3 md:mt-4 flex items-center justify-center gap-4">
            <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] md:tracking-[0.3em]">Confidential Medical AI</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Chats;
