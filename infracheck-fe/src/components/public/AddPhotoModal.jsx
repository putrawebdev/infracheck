import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  X,
  AlertCircle,
  Trash2,
  FileImage,
} from 'lucide-react';
import Spinner from '../ui/Spinner';
import { compressImage } from '../../utils/imageCompressor';

/**
 * AddPhotoModal - Material You (M3) Mobile-first Bottom Sheet / Dialog
 * Specially refined for mobile layout to make uploading photos effortless.
 */
const AddPhotoModal = ({
  isOpen,
  onClose,
  report,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [caption, setCaption] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl('');
      setUrlInput('');
      setCaption('');
      setErrorMessage('');
      setCompressionStats(null);
    } else {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [isOpen]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const headline = report.headline || report.title || `Laporan ${report.category_name || report.category?.name || 'Kerusakan'}`;
  const trackingId = report.tracking_id || `IC-2026-${String(report.id || 1).padStart(5, '0')}`;

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran foto terlalu besar. Maksimum 10MB.');
      return;
    }

    setErrorMessage('');
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      setIsCompressing(true);
      const res = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
      setSelectedFile(res.file);
      setPreviewUrl(res.previewUrl);
      setCompressionStats(res);
    } catch (err) {
      console.warn('Compression fallback to original file:', err);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCompressionStats(null);
    } finally {
      setIsCompressing(false);
      setUrlInput('');
    }
  };

  const handleUrlChange = (val) => {
    setUrlInput(val);
    if (val.trim()) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(val.trim());
      setErrorMessage('');
    } else {
      setPreviewUrl('');
    }
  };

  const handleClearPhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setUrlInput('');
    setErrorMessage('');
    setCompressionStats(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile && !urlInput.trim()) {
      setErrorMessage('Silakan pilih foto dari kamera/galeri atau masukkan tautan URL foto.');
      return;
    }

    onSubmit({
      file: selectedFile,
      url: urlInput.trim(),
      caption: caption.trim() || 'Bukti Tambahan Warga',
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="add-photo-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Hidden File Inputs */}
      {/* 1. Camera Direct Trigger with capture="environment" */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* 2. Gallery / File System Trigger */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* Main Material You Bottom Sheet / Modal Dialog */}
      <div
        id="add-photo-modal-sheet"
        className="w-full sm:max-w-lg bg-[#191c22] border-t sm:border border-[#3c4150] rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[#e1e2e5] font-['Poppins',sans-serif]"
      >

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#2d323f]">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Tambah Foto Bukti Kerusakan
              </h2>
              <p className="text-xs text-slate-400">
                Unggah foto terbaru untuk memperkuat verifikasi laporan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-[#252a35] text-slate-400 hover:text-white hover:bg-[#323846] flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-[#371e21] border border-[#5c2529] text-[#ffb4ab] text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb4ab]" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Upload / Selection Area */}
          {!previewUrl ? (
            <div className="space-y-3">
              {/* TWO LARGE MOBILE-FRIENDLY ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3.5 px-3 rounded-2xl bg-[#262c37] hover:bg-[#323948] active:bg-[#3d4556] border border-[#3b4353] flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer active:scale-98 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-[#354376] group-hover:bg-[#435594] text-[#b8c8ff] flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Ambil Kamera</span>
                    <span className="text-[10px] text-slate-400">Buka kamera HP</span>
                  </div>
                </button>

                {/* 2. Gallery Button */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-3.5 px-3 rounded-2xl bg-[#262c37] hover:bg-[#323948] active:bg-[#3d4556] border border-[#3b4353] flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer active:scale-98 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2a3c33] group-hover:bg-[#334d40] text-[#7ce0b2] flex items-center justify-center transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Pilih Galeri</span>
                    <span className="text-[10px] text-slate-400">File atau album</span>
                  </div>
                </button>
              </div>

              {/* Drag and Drop Zone Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => galleryInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${isDragOver
                  ? 'border-[#5F7ADB] bg-[#5F7ADB]/10'
                  : 'border-[#383e4d] hover:border-[#5F7ADB] bg-[#1e232c]/70 hover:bg-[#232934]'
                  }`}
              >
                {isCompressing ? (
                  <>
                    <Spinner size="sm" color="blue" />
                    <p className="text-xs font-medium text-slate-200">
                      Mengompresi foto bukti...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-[#282e3a] flex items-center justify-center text-slate-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-200">
                      Atau sentuh / seret file foto ke sini
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Mendukung JPG, PNG, WEBP hingga 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Selected Photo Preview Card */
            <div className="p-3 bg-[#202530] border border-[#373e4f] rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-black/40 border border-white/10 group">
                <img
                  src={previewUrl}
                  alt="Preview Foto Bukti"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                {/* Top Quick Actions on Image */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="p-1.5 rounded-full bg-black/70 text-red-400 hover:bg-red-600 hover:text-white transition-colors backdrop-blur-xs cursor-pointer shadow-md"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Re-take / Change Photo Quick Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-[#353d4d] text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#3b4354]"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ambil Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2a303d] hover:bg-[#353d4d] text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#3b4354]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pilih Lain</span>
                </button>
              </div>
            </div>
          )}

          {/* Optional Caption Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 px-0.5 flex items-center justify-between">
              <span>Keterangan Bukti</span>
              <span className="text-[10px] text-slate-500 font-normal">Opsional</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Contoh: Kondisi lubang setelah hujan lebat..."
              className="w-full bg-[#1e232c] border border-[#343b49] focus:border-[#5F7ADB] focus:ring-1 focus:ring-[#5F7ADB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* Action Button Row */}
          <div className="pt-2 border-t border-[#2d323f] flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-1/3 py-3 px-4 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-[#252a35] hover:bg-[#313745] active:bg-[#3c4455] transition-colors cursor-pointer disabled:opacity-50 text-center order-2 sm:order-1"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!selectedFile && !urlInput.trim())}
              className="w-full sm:flex-1 py-3 px-5 rounded-full text-xs sm:text-sm font-semibold bg-[#5F7ADB] hover:bg-[#4d69d4] active:bg-[#3d59c4] text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span>Mengunggah Foto Bukti...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Unggah Foto Bukti</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPhotoModal;
