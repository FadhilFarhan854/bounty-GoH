"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Scroll, 
  Image as ImageIcon, 
  Video, 
  Upload, 
  X, 
  Play,
  User,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  Key
} from "lucide-react";
import Image from "next/image";
import { GalleryItem } from "../types/gallery";
import { Footer } from "../components/Footer";

const ITEMS_PER_PAGE = 12;

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    caption: '',
    uploadedBy: ''
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination calculations
  const totalPages = Math.ceil(galleryItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = galleryItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Load gallery items on mount
  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      const response = await fetch('/api/gallery', { cache: 'no-store' });
      const data = await response.json();
      setGalleryItems(data);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('caption', uploadForm.caption);
      formData.append('uploadedBy', uploadForm.uploadedBy || 'Anonymous Hunter');

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setGalleryItems(prev => [result.item, ...prev]);
        setShowUploadModal(false);
        resetUploadForm();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({ file: null, caption: '', uploadedBy: '' });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteCipher, setDeleteCipher] = useState('');
  const [cipherError, setCipherError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteItemId(id);
    setShowDeleteConfirm(true);
    setDeleteCipher('');
    setCipherError('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteCipher !== 'goh-123') {
      setCipherError('The ancient seal rejects thee...');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setCipherError('');
      }, 600);
      return;
    }

    if (!deleteItemId) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItemId }),
      });

      const result = await response.json();

      if (result.success) {
        setGalleryItems(prev => prev.filter(item => item.id !== deleteItemId));
        setSelectedItem(null);
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
        setDeleteCipher('');
      } else {
        alert('Delete failed: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers - same as landing page */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url("../assets/parchment-bg.jpg")` }}
      />
      
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 45% 25%) 0%, hsl(30 25% 15%) 35%, hsl(25 20% 10%) 60%, hsl(20 15% 6%) 100%)'
        }}
      />

      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(0,0,0,0.9)]" />

      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 60% 30% / 0.3) 0%, transparent 50%)'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          className="w-full py-8 px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Top decorative line */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-primary/40" />
              <Shield className="w-6 h-6 text-primary/60" />
              <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-primary/40" />
            </div>

            {/* Title */}
            <div className="text-center">
              <motion.div
                className="flex items-center justify-center gap-3 mb-2"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Scroll className="w-5 h-5 text-primary/50" />
                <span className="text-muted-foreground text-sm tracking-[0.4em] uppercase font-cinzel">
                  Guild Archives
                </span>
                <Scroll className="w-5 h-5 text-primary/50 transform scale-x-[-1]" />
              </motion.div>

              <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl tracking-wider">
                <span className="gold-shimmer">Our Memories</span>
              </h1>

              <p className="mt-4 text-muted-foreground text-lg italic max-w-md mx-auto">
                &quot;Here lies our remembrance, moment, and  memories&quot;
              </p>
            </div>

            {/* Bottom decorative line */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-primary/30" />
              <span className="text-primary/40 text-sm">✦ ◆ ✦</span>
              <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </div>
        </motion.header>

        {/* Upload Button */}
        <div className="flex justify-center px-4 mb-8">
          <motion.button
            onClick={() => setShowUploadModal(true)}
            className="relative group px-8 py-4 bg-gradient-to-b from-primary/20 to-primary/10 border-2 border-primary/40 rounded-lg hover:border-primary/60 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            <div className="flex items-center gap-3 relative z-10">
              <Upload className="w-5 h-5 text-primary" />
              <span className="font-cinzel text-primary tracking-wider">
                Post Your Moment
              </span>
            </div>
          </motion.button>
        </div>

        {/* Gallery Grid */}
        <main className="flex-1 px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : galleryItems.length === 0 ? (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-primary/40" />
                </div>
                <p className="text-muted-foreground text-lg font-cinzel">
                  No hunt records yet
                </p>
                <p className="text-muted-foreground/60 text-sm mt-2 italic">
                  Be the first to document your legendary victories!
                </p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, staggerChildren: 0.1 }}
                >
                  {currentItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Card frame */}
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 bg-gradient-to-b from-card to-card/80 group-hover:border-primary/40 transition-all duration-300">
                        {/* Corner decorations */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg z-10" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg z-10" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg z-10 sm:block hidden" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg z-10 sm:block hidden" />

                        {/* Media content */}
                        {item.type === 'image' ? (
                          <Image
                            src={item.thumbnail || item.path}
                            alt={item.caption || 'Gallery image'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-black/50 flex items-center justify-center">
                            <video
                              src={item.path}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                            <Play className="w-12 h-12 text-white/80 relative z-10" />
                          </div>
                        )}

                        {/* Type badge */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm">
                            {item.type === 'video' ? (
                              <Video className="w-4 h-4 text-primary" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>

                        {/* Overlay info - Desktop only */}
                        <div className="hidden sm:block absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {item.caption && (
                            <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                              {item.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-white/70">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.uploadedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.uploadedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile info - Below card */}
                      <div className="sm:hidden mt-3 px-1">
                        {item.caption && (
                          <p className="text-white/90 text-sm font-medium line-clamp-2 mb-2">
                            {item.caption}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary/60" />
                            {item.uploadedBy}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                            {formatDate(item.uploadedAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    className="flex items-center justify-center gap-2 mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {/* Previous button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-primary/30 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show limited page numbers on mobile
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 1;
                        
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground/50">
                              •••
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-cinzel text-sm transition-all ${
                              currentPage === page
                                ? 'bg-primary/20 border-2 border-primary/50 text-primary'
                                : 'border border-primary/20 bg-card/30 text-muted-foreground hover:text-primary hover:border-primary/40'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-primary/30 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {/* Page info */}
                {totalPages > 1 && (
                  <p className="text-center text-muted-foreground/60 text-sm mt-4 font-cinzel">
                    Showing {startIndex + 1}-{Math.min(endIndex, galleryItems.length)} of {galleryItems.length} records
                  </p>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowUploadModal(false);
              resetUploadForm();
            }}
          >
            <motion.div
              className="relative w-full max-w-lg bg-gradient-to-b from-card to-background border-2 border-primary/30 rounded-xl p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal header */}
              <div className="text-center mb-6">
                <h2 className="font-cinzel text-2xl gold-shimmer mb-2">
                    Seal your Remembrance
                </h2>
                <p className="text-muted-foreground text-sm italic">
                  Let our chronicles remember our memories for eternity
                </p>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-primary/20">
                    {uploadForm.file?.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    )}
                    <button
                      onClick={() => {
                        resetUploadForm();
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary/60" />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground font-medium">
                        Click to upload
                      </p>
                      <p className="text-muted-foreground/60 text-sm mt-1">
                        Images or Videos
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Caption input */}
              <div className="mb-4">
                <label className="block text-sm font-cinzel text-muted-foreground mb-2">
                  Caption <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <textarea
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Describe your legendary hunt..."
                  className="w-full px-4 py-3 bg-background/50 border border-primary/20 rounded-lg text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  rows={3}
                />
              </div>

              {/* Hunter name input */}
              <div className="mb-6">
                <label className="block text-sm font-cinzel text-muted-foreground mb-2">
                  Hunter Name <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.uploadedBy}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, uploadedBy: e.target.value }))}
                  placeholder="Your name in the chronicles"
                  className="w-full px-4 py-3 bg-background/50 border border-primary/20 rounded-lg text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Submit button */}
              <button
                onClick={handleUpload}
                disabled={!uploadForm.file || isUploading}
                className="w-full py-4 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/40 rounded-lg font-cinzel tracking-wider text-primary hover:from-primary/30 hover:via-primary/40 hover:to-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Scroll className="w-5 h-5" />
                    <span>Add to Archives</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="relative max-w-5xl max-h-[90vh] w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Media content */}
              <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-black">
                {selectedItem.type === 'image' ? (
                  <Image
                    src={selectedItem.path}
                    alt={selectedItem.caption || 'Gallery image'}
                    width={1920}
                    height={1080}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                ) : (
                  <video
                    src={selectedItem.path}
                    className="w-full max-h-[80vh]"
                    controls
                    autoPlay
                  />
                )}
              </div>

              {/* Info panel */}
              <div className="mt-4 p-4 bg-card/80 rounded-lg border border-primary/20">
                {selectedItem.caption && (
                  <p className="text-white font-medium mb-3">
                    {selectedItem.caption}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary/60" />
                      {selectedItem.uploadedBy}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary/60" />
                      {formatDate(selectedItem.uploadedAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      {selectedItem.type === 'video' ? (
                        <Video className="w-4 h-4 text-primary/60" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-primary/60" />
                      )}
                      {selectedItem.type === 'video' ? 'Video' : 'Image'}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteClick(selectedItem.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="text-sm font-cinzel">Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal with Cipher */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteItemId(null);
              setDeleteCipher('');
            }}
          >
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-card to-background border-2 border-primary/30 rounded-xl p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Key className="w-12 h-12 text-destructive mx-auto mb-4" />
                </motion.div>
                <h3 className="font-cinzel text-2xl text-parchment mb-2">
                  The Destruction Seal
                </h3>
                <p className="text-sm text-muted-foreground italic">
                  &quot;Only those with the sacred cipher may erase from the archives...&quot;
                </p>
              </div>

              {/* Warning */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You are about to <span className="text-destructive font-semibold">permanently delete</span> this 
                  record from the <span className="text-parchment font-semibold">Guild Archives</span>. 
                  This action cannot be undone.
                </p>
              </div>

              {/* Cipher Input */}
              <div className="mb-6">
                <label className="block text-sm font-cinzel text-parchment mb-2">
                  Enter the Cipher
                </label>
                <motion.input
                  type="password"
                  value={deleteCipher}
                  onChange={(e) => setDeleteCipher(e.target.value)}
                  placeholder="Guild cipher..."
                  className={`w-full px-4 py-3 bg-background/50 border-2 rounded-lg font-cinzel text-parchment placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors ${
                    cipherError ? 'border-destructive' : 'border-primary/30'
                  }`}
                  animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteConfirm();
                    }
                  }}
                />
                <AnimatePresence>
                  {cipherError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-sm mt-2 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {cipherError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteItemId(null);
                    setDeleteCipher('');
                  }}
                  className="flex-1 py-3 bg-muted/30 border border-primary/20 rounded-lg font-cinzel text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting || !deleteCipher}
                  className="flex-1 py-3 bg-destructive/20 border border-destructive/40 rounded-lg font-cinzel text-destructive hover:bg-destructive/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
