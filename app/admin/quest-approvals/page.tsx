"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Loader2,
  Video,
  User,
  Skull,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Play,
} from "lucide-react";

interface Submission {
  id: string;
  playerName: string;
  bossId: string;
  bossName: string;
  bounty: string;
  videoFileName: string;
  videoUrl?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewNote?: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function QuestApprovalsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setIsMounted(true);
    document.body.classList.add("no-pulse");
    return () => {
      document.body.classList.remove("no-pulse");
    };
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/firekeeper/submissions${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/firekeeper/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action, reviewNote: reviewNote || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setReviewNote("");
      setExpandedId(null);
      await fetchSubmissions();
    } catch (error) {
      console.error("Action error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-900/30", border: "border-amber-700/40", label: "Menunggu" },
    approved: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-900/30", border: "border-emerald-700/40", label: "Disetujui" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-900/30", border: "border-red-700/40", label: "Ditolak" },
  };

  const filterOptions: { value: FilterStatus; label: string; count?: number }[] = [
    { value: "all", label: "Semua" },
    { value: "pending", label: "Menunggu" },
    { value: "approved", label: "Disetujui" },
    { value: "rejected", label: "Ditolak" },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-stone-950 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black" />
      <div className="fixed inset-0 bg-[url('/assets/noise.png')] opacity-5" />

      {/* Ember particles */}
      {isMounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/30 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: `-5%`,
              }}
              animate={{
                y: [0, -800],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Shield className="w-10 h-10 text-amber-500" />
              <Flame className="w-5 h-5 text-orange-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="font-cinzel text-2xl md:text-3xl text-yellow-200 tracking-wider">
                Quest Approvals
              </h1>
              <p className="font-crimson text-yellow-400/60 text-sm mt-1">
                Kelola penyelesaian quest dari para pengembara
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-900/80 border border-yellow-900/40 rounded-xl text-yellow-300 font-crimson text-sm hover:border-yellow-600/60 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{filterOptions.find((f) => f.value === filter)?.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-stone-900 border border-yellow-900/40 rounded-xl overflow-hidden shadow-xl shadow-black/50 z-50"
                >
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilter(opt.value);
                        setCurrentPage(1);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left font-crimson text-sm transition-colors flex items-center justify-between
                        ${filter === opt.value
                          ? "bg-yellow-900/30 text-yellow-200"
                          : "text-yellow-400/70 hover:bg-stone-800 hover:text-yellow-300"
                        }`}
                    >
                      {opt.label}
                      {filter === opt.value && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchSubmissions}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900/80 border border-yellow-900/40 rounded-xl text-yellow-400/70 font-crimson text-sm hover:text-yellow-300 hover:border-yellow-600/60 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* Submissions List */}
        {isLoading && submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
            <p className="font-crimson text-yellow-300/70">Memuat data...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-stone-900/80 border border-amber-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500/60" />
            </div>
            <p className="font-cinzel text-yellow-300 mb-1">Tidak ada data</p>
            <p className="font-crimson text-yellow-400/60 text-sm">
              Belum ada submission dengan status &quot;{filterOptions.find((f) => f.value === filter)?.label}&quot;
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-crimson text-yellow-400/70 text-sm">
                Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, submissions.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, submissions.length)} dari {submissions.length} submission
              </p>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {submissions
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((sub, index) => {
                  const config = statusConfig[sub.status];
                  const StatusIcon = config.icon;
                  const isExpanded = expandedId === sub.id;
                  const isProcessing = processingId === sub.id;
                  const isVideoPlaying = playingVideoId === sub.id;

                  return (
                    <motion.div
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${config.bg} border ${config.border} rounded-2xl overflow-hidden transition-colors`}
                    >
                      {/* Main Row */}
                      <button
                        onClick={() => {
                          setExpandedId(isExpanded ? null : sub.id);
                          if (isExpanded) setPlayingVideoId(null);
                        }}
                        className="w-full p-4 md:p-5 text-left"
                      >
                        <div className="flex items-start gap-4">
                          {/* Status Icon */}
                          <div className={`mt-1 p-2 rounded-xl ${config.bg} border ${config.border}`}>
                            <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-3.5 h-3.5 text-yellow-400/70" />
                              <span className="font-cinzel text-yellow-200 text-sm md:text-base tracking-wide truncate">
                                {sub.playerName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <Skull className="w-3.5 h-3.5 text-red-400/70" />
                              <span className="font-crimson text-yellow-300 text-sm truncate">
                                {sub.bossName}
                              </span>
                              <span className="text-yellow-500/50 text-xs">•</span>
                              <span className="font-crimson text-yellow-400/70 text-xs">
                                {sub.bounty}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-yellow-400/50 font-crimson">
                                <Clock className="w-3 h-3" />
                                {formatDate(sub.submittedAt)}
                              </span>
                              {sub.videoFileName !== "N/A" && (
                                <span className="flex items-center gap-1 text-yellow-400/50 font-crimson">
                                  <Video className="w-3 h-3" />
                                  {sub.videoFileName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expand Arrow */}
                          <ChevronDown
                            className={`w-5 h-5 text-yellow-400/50 transition-transform mt-1 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 md:px-5 pb-5 pt-1 border-t border-amber-900/20">
                              {/* Video Player */}
                              {sub.videoUrl && (
                                <div className="mb-4">
                                  {isVideoPlaying ? (
                                    <div className="relative rounded-xl overflow-hidden border border-yellow-700/30 bg-black">
                                      <video
                                        src={sub.videoUrl}
                                        controls
                                        autoPlay
                                        className="w-full max-h-[400px] rounded-xl"
                                        onError={() => setPlayingVideoId(null)}
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPlayingVideoId(sub.id);
                                      }}
                                      className="w-full relative group rounded-xl overflow-hidden border border-yellow-700/30 bg-stone-900/60 hover:border-yellow-500/50 transition-colors"
                                    >
                                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <div className="w-14 h-14 rounded-full bg-yellow-600/20 border-2 border-yellow-500/40 flex items-center justify-center group-hover:bg-yellow-600/30 group-hover:border-yellow-400/60 transition-all">
                                          <Play className="w-7 h-7 text-yellow-400 ml-0.5" />
                                        </div>
                                        <span className="font-crimson text-yellow-300/80 text-sm">
                                          Putar Video Bukti
                                        </span>
                                        <span className="font-crimson text-yellow-500/40 text-xs">
                                          {sub.videoFileName}
                                        </span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              )}

                              {!sub.videoUrl && sub.videoFileName !== "N/A" && (
                                <div className="mb-4 p-3 bg-stone-800/40 border border-yellow-900/20 rounded-lg">
                                  <p className="text-sm text-yellow-400/60 font-crimson flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    File: {sub.videoFileName} (URL tidak tersedia)
                                  </p>
                                </div>
                              )}

                              {/* Review Note */}
                              {sub.reviewedAt && sub.reviewNote && (
                                <div className="mb-4 p-3 bg-stone-800/40 border border-yellow-900/20 rounded-lg">
                                  <p className="text-xs text-yellow-400/60 font-crimson mb-1">Catatan Review:</p>
                                  <p className="text-sm text-yellow-300 font-crimson">{sub.reviewNote}</p>
                                </div>
                              )}

                              {sub.reviewedAt && (
                                <p className="text-xs text-yellow-400/50 font-crimson mb-4">
                                  Direview: {formatDate(sub.reviewedAt)}
                                </p>
                              )}

                              {/* Actions (only for pending) */}
                              {sub.status === "pending" && (
                                <div className="space-y-3">
                                  <textarea
                                    value={expandedId === sub.id ? reviewNote : ""}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Catatan review (opsional)..."
                                    className="w-full px-4 py-3 bg-stone-800/60 border border-yellow-900/30 rounded-xl text-yellow-200 placeholder-yellow-700/30 font-crimson text-sm focus:outline-none focus:border-yellow-600/50 resize-none"
                                    rows={2}
                                  />
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleAction(sub.id, "approved")}
                                      disabled={isProcessing}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800/40 hover:bg-emerald-700/50 border border-emerald-600/40 rounded-xl text-emerald-300 font-cinzel text-sm tracking-wider disabled:opacity-50 transition-colors"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAction(sub.id, "rejected")}
                                      disabled={isProcessing}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-800/40 border border-red-700/40 rounded-xl text-red-400 font-cinzel text-sm tracking-wider disabled:opacity-50 transition-colors"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {submissions.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 bg-stone-900/80 border border-yellow-900/30 rounded-xl text-yellow-400 hover:border-yellow-600/50 hover:text-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.ceil(submissions.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-cinzel text-sm tracking-wider transition-colors ${
                      currentPage === page
                        ? "bg-yellow-700/30 border border-yellow-500/50 text-yellow-200"
                        : "bg-stone-900/80 border border-yellow-900/20 text-yellow-500/60 hover:border-yellow-700/40 hover:text-yellow-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(submissions.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(submissions.length / ITEMS_PER_PAGE)}
                  className="p-2.5 bg-stone-900/80 border border-yellow-900/30 rounded-xl text-yellow-400 hover:border-yellow-600/50 hover:text-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent mb-6" />
          <p className="font-crimson text-yellow-500/30 text-xs">
            Guild of Hunters — Quest Approval System
          </p>
        </div>
      </div>
    </div>
  );
}
