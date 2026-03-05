"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Flame, MessageCircle, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "npc" | "system";
  content: string;
  timestamp: Date;
}

interface CurrentQuest {
  bossId: string;
  bossName: string;
  bounty: string;
  description?: string;
  status: 'offered' | 'accepted' | 'completed';
}

export default function FirekeeperPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentQuest, setCurrentQuest] = useState<CurrentQuest | null>(null);
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [playerName, setPlayerName] = useState<string>("Pengembara");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Disable body pulse animation on this page
  useEffect(() => {
    setIsMounted(true);
    document.body.classList.add("no-pulse");
    return () => {
      document.body.classList.remove("no-pulse");
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const handleStartConversation = () => {
    setIsChatOpen(true);
    setHasInteracted(true);
    
    // Initial NPC greeting - simple, will be replaced by OpenAI response
    const greeting: ChatMessage = {
      id: `greeting-${Date.now()}`,
      role: "npc",
      content: "...",
      timestamp: new Date(),
    };
    setMessages([greeting]);
    
    // Trigger first OpenAI response
    fetchOpenAIGreeting();
  };

  const fetchOpenAIGreeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/firekeeper/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          currentQuest: null,
          selectedBossId: null,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // Lock the boss from first response
      if (data.selectedBossId) {
        setSelectedBossId(data.selectedBossId);
      }
      
      const npcResponse: ChatMessage = {
        id: `npc-${Date.now()}`,
        role: "npc",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages([npcResponse]);
    } catch (error) {
      console.error("Greeting error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "Api sedang padam... coba lagi sebentar.",
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentQuest) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Hanya file video yang diperbolehkan');
      return;
    }

    setIsUploading(true);

    try {
      // Create system message for upload
      const uploadMessage: ChatMessage = {
        id: `upload-${Date.now()}`,
        role: "system",
        content: `Fate Maiden sedang membaca ingatan penyelesaian quest`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, uploadMessage]);

      // Step 1: Get signed upload params from our server
      const signRes = await fetch('/api/firekeeper/submissions/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const signData = await signRes.json();

      if (!signRes.ok) {
        throw new Error(signData.error || 'Failed to get upload signature');
      }

      // Step 2: Upload directly from browser to Cloudinary
      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('api_key', signData.apiKey);
      cloudFormData.append('timestamp', String(signData.timestamp));
      cloudFormData.append('signature', signData.signature);
      cloudFormData.append('folder', signData.folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`;
      const cloudRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: cloudFormData,
      });

      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
        throw new Error(cloudData.error?.message || 'Cloudinary upload failed');
      }

      // Step 3: Submit to approval queue with Cloudinary URL
      try {
        await fetch("/api/firekeeper/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName,
            bossId: currentQuest.bossId,
            bossName: currentQuest.bossName,
            bounty: currentQuest.bounty,
            videoFileName: file.name,
            videoUrl: cloudData.secure_url,
          }),
        });
      } catch (submitErr) {
        console.error("Submission error:", submitErr);
      }

      // Update quest status
      setCurrentQuest({ ...currentQuest, status: 'completed' });

      const successMessage: ChatMessage = {
        id: `upload-success-${Date.now()}`,
        role: "system",
        content: `Penyelesaian sudah terkonfirmasi`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);

      // Trigger final GPT response
      await sendCompletionMessage();

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage: ChatMessage = {
        id: `upload-error-${Date.now()}`,
        role: "system",
        content: '❌ Gagal mengunggah video. Coba lagi.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendCompletionMessage = async () => {
    setIsLoading(true);
    try {
      const history = messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role === "npc" ? "assistant" : "user", content: m.content }));
      
      const response = await fetch("/api/firekeeper/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...history,
            { role: "user", content: "Aku telah menyelesaikan quest dan mengunggah buktinya." }
          ],
          currentQuest: { ...currentQuest, status: "completed" },
          selectedBossId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const npcResponse: ChatMessage = {
        id: `npc-${Date.now()}`,
        role: "npc",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, npcResponse]);
      setConversationEnded(true);

    } catch (error) {
      console.error("Completion message error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Capture player name from first or second user message
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (userMsgCount === 0) {
      // This is the first user message — likely their name
      setPlayerName(inputValue.trim());
    }

    try {
      // Convert chat history ke format OpenAI (semua context dikirim)
      const history = [...messages, userMessage]
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role === "npc" ? "assistant" : "user", content: m.content }));

      const response = await fetch("/api/firekeeper/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          currentQuest,
          selectedBossId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // Keep boss locked
      if (data.selectedBossId && !selectedBossId) {
        setSelectedBossId(data.selectedBossId);
      }
      
      const npcResponse: ChatMessage = {
        id: `npc-${Date.now()}`,
        role: "npc",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, npcResponse]);

      // Quest offered
      if (data.questOffered && data.quest) {
        setCurrentQuest(data.quest);
      }

      // Quest accepted -> show upload UI
      if (data.questAccepted && data.quest) {
        setCurrentQuest({ ...data.quest, status: "accepted" });
      }

      // Quest rejected -> end conversation
      if (data.questRejected) {
        setConversationEnded(true);
      }

      // Quest completed
      if (data.questCompleted) {
        setConversationEnded(true);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "Koneksi terputus... coba lagi nanti.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative min-h-screen w-full h-screen overflow-hidden">
      {/* Background Image - Desktop */}
      <div
        className="hidden md:block fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/bg-story.webp')",
        }}
      />
      {/* Background Video - Mobile */}
      <div className="md:hidden fixed inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/vid-bg-mobile.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dark overlay for better readability */}
      <div className="fixed inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/60" />

      {/* Ambient particle effects */}
      {isMounted && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/40 rounded-full"
              style={{
                left: `${20 + Math.random() * 30}%`,
                bottom: `${10 + Math.random() * 20}%`,
              }}
              animate={{
                y: [0, -100 - Math.random() * 200],
                x: [0, (Math.random() - 0.5) * 50],
                opacity: [0.4, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top padding for navbar */}
        <div className="h-16 md:h-20" />

        {/* Main area */}
        <div className="flex-1 flex items-end md:items-center justify-center md:justify-end p-4 md:p-8">
          {/* Interact Button - shown when chat is closed */}
          <AnimatePresence>
            {!isChatOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleStartConversation}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-8 lg:right-16
                  flex items-center gap-3 px-6 py-4 
                  bg-gradient-to-r from-amber-900/80 to-orange-900/80 
                  border-2 border-amber-500/50 rounded-xl
                  hover:border-amber-400/80 hover:from-amber-800/90 hover:to-orange-800/90
                  transition-all duration-300 group
                  shadow-lg shadow-orange-900/50"
              >
               
                <span className="font-cinzel text-amber-200 tracking-wider">
                  {hasInteracted ? "Lanjutkan Bicara" : "Ajak Bicara"}
                </span>
                <MessageCircle className="w-5 h-5 text-amber-400/70" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Chat Panel */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                className="w-full max-w-md md:max-w-lg lg:max-w-xl 
                  h-[70vh] md:h-[75vh] max-h-[600px]
                  flex flex-col
                  bg-gradient-to-b from-stone-900/95 to-stone-950/95 
                  backdrop-blur-md
                  border-2 border-amber-900/50 rounded-2xl
                  shadow-2xl shadow-black/50
                  overflow-hidden"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/30 bg-amber-900/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Flame className="w-6 h-6 text-orange-400" />
                      <motion.div
                        className="absolute inset-0 w-6 h-6 text-orange-400 blur-sm"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Flame className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <div>
                      <h2 className="font-cinzel text-amber-200 text-sm md:text-base tracking-wider">
                        Fate Maiden
                      </h2>
                      <p className="text-xs text-amber-500/60 font-crimson">
                        {currentQuest 
                          ? `Quest: ${currentQuest.bossName}` 
                          : "Penjaga Perapian Kuno"
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 rounded-lg text-amber-400/60 hover:text-amber-300 hover:bg-amber-900/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 
                  scrollbar-custom
                  [&::-webkit-scrollbar]:w-2
                  [&::-webkit-scrollbar-track]:bg-stone-900/30
                  [&::-webkit-scrollbar-track]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-gradient-to-b
                  [&::-webkit-scrollbar-thumb]:from-amber-700/60
                  [&::-webkit-scrollbar-thumb]:to-orange-800/60
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:border
                  [&::-webkit-scrollbar-thumb]:border-amber-900/30
                  hover:[&::-webkit-scrollbar-thumb]:from-amber-600/80
                  hover:[&::-webkit-scrollbar-thumb]:to-orange-700/80">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : message.role === "system"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "system" ? (
                        <div className="bg-amber-900/30 border border-amber-700/30 px-4 py-2 rounded-full">
                          <span className="text-xs md:text-sm text-amber-400 font-crimson">
                            {message.content}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl font-crimson text-sm md:text-base ${
                            message.role === "user"
                              ? "bg-amber-800/40 text-amber-100 rounded-br-md border border-amber-700/30"
                              : "bg-stone-800/80 text-amber-100 rounded-bl-md border border-amber-900/30"
                          }`}
                        >
                          {message.role === "npc" && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span className="text-xs text-orange-400/80 font-cinzel tracking-wider">
                                Fate Maiden
                              </span>
                            </div>
                          )}
                          <p className="leading-relaxed">{message.content}</p>
                          <span className="text-[10px] text-amber-500/40 mt-1 block text-right">
                            {message.timestamp.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-stone-800/80 border border-amber-900/30 px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                          <span className="text-sm text-amber-400/60 font-crimson italic">
                            Fate Maiden sedang berpikir...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-amber-900/30 bg-stone-900/50">
                  {/* Video Upload Section - Show when quest is accepted */}
                  {currentQuest?.status === 'accepted' && !conversationEnded && (
                    <div className="mb-4 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-amber-400 text-2xl">⚠️</div>
                        <div className="flex-1">
                          <p className="text-amber-200 font-cinzel text-sm font-semibold mb-1">
                            Upload Bukti Penyelesaian Quest
                          </p>
                          <p className="text-amber-400/70 text-xs font-crimson">
                            Jangan close tab ini agar chat tidak tereset. Upload video bukti kamu mengalahkan {currentQuest.bossName}.
                          </p>
                        </div>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="video-upload"
                      />
                      
                      <label
                        htmlFor="video-upload"
                        className={`block w-full px-4 py-3 text-center
                          bg-gradient-to-r from-amber-700 to-orange-700
                          hover:from-amber-600 hover:to-orange-600
                          border border-amber-600/50 rounded-xl
                          text-amber-100 font-cinzel text-sm tracking-wider
                          cursor-pointer transition-all duration-200
                          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {isUploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mengunggah...
                          </span>
                        ) : (
                          '📹 Pilih Video Bukti'
                        )}
                      </label>
                    </div>
                  )}

                  {/* Text Input - Hide when conversation ended */}
                  {!conversationEnded && (
                    <>
                      <div className="flex items-center gap-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={currentQuest?.status === 'accepted' ? "Upload video untuk melanjutkan..." : "Ketik pesanmu..."}
                          disabled={isLoading || currentQuest?.status === 'accepted'}
                          className="flex-1 px-4 py-3 
                            bg-stone-800/60 border border-amber-900/40 rounded-xl
                            text-amber-100 placeholder-amber-500/40
                            font-crimson text-sm md:text-base
                            focus:outline-none focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading || currentQuest?.status === 'accepted'}
                          className="p-3 
                            bg-gradient-to-r from-amber-700 to-orange-700
                            hover:from-amber-600 hover:to-orange-600
                            disabled:from-stone-700 disabled:to-stone-700
                            border border-amber-600/50 rounded-xl
                            text-amber-100 
                            disabled:text-stone-500 disabled:cursor-not-allowed
                            transition-all duration-200
                            shadow-lg shadow-orange-900/30"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Quick action hints */}
                      {!currentQuest || currentQuest.status === 'offered' ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(currentQuest?.status === 'offered'
                            ? ["Aku terima", "Tidak, aku menolak"]
                            : ["Siapa kamu?", "Ceritakan tentang Guild", "Berikan aku quest"]
                          ).map((hint) => (
                            <button
                              key={hint}
                              onClick={() => setInputValue(hint)}
                              disabled={isLoading}
                              className="px-3 py-1.5 
                                bg-stone-800/40 border border-amber-900/30 rounded-lg
                                text-xs text-amber-400/70 font-crimson
                                hover:bg-amber-900/20 hover:text-amber-300
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200"
                            >
                              {hint}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Conversation Ended Message */}
                  {conversationEnded && (
                    <div className="text-center py-4">
                      <p className="text-amber-400/60 text-sm font-crimson italic">
                        Percakapan telah berakhir. Refresh halaman untuk memulai lagi.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
