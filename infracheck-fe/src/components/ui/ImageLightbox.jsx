import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  MapPin,
  ExternalLink
} from 'lucide-react';
import CloudinaryImage from './CloudinaryImage';
import { getReportHeadline } from '../../utils/reportHelpers';

/**
 * ImageLightbox
 *
 * Interactive full-screen gallery lightbox modal for multi-photo evidence viewing.
 * Supports keyboard navigation (ArrowLeft, ArrowRight, Escape), thumbnail strip,
 * counter badges, and responsive gestures.
 */
const ImageLightbox = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  report = null,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (images?.length || 1) - 1)));
    }
  }, [isOpen, initialIndex, images]);

  const totalImages = images?.length || 0;
  const currentImage = images?.[currentIndex] || null;

  // Find caption from report.photos if available
  const currentCaption = React.useMemo(() => {
    if (!report?.photos || !Array.isArray(report.photos) || !currentImage) return null;
    const match = report.photos.find(
      (p) => (typeof p === 'object' && p?.photo_url === currentImage) || p === currentImage
    );
    return match?.caption && match.caption !== 'Foto Bukti Kerusakan' ? match.caption : null;
  }, [report, currentImage]);

  const handlePrev = useCallback(() => {
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const handleNext = useCallback(() => {
    if (totalImages <= 1) return;
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentImage) return null;

  const headline = report ? getReportHeadline(report) : 'Bukti Foto Kerusakan';
  const locationText = report?.location || report?.location_address || '';
  const trackingId = report?.tracking_id || '';

  return (
    <div
      id="image-lightbox-overlay"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* TOP HEADER BAR */}
      <div
        className="flex items-center justify-between gap-3 text-white z-10 w-full max-w-5xl mx-auto shrink-0 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Info: Tracking ID, Title, & Location */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {trackingId && (
              <span className="text-[11px] font-mono font-bold text-blue-300 bg-blue-950/80 border border-blue-800/70 px-2.5 py-0.5 rounded-full shadow-sm">
                {trackingId}
              </span>
            )}
            <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {headline}
            </h4>
          </div>
          {locationText && (
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span>{locationText}</span>
            </p>
          )}
        </div>

        {/* Right Controls: Counter & Close Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {totalImages > 1 && (
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200 shadow-sm flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {currentIndex + 1} / {totalImages}
              </span>
            </div>
          )}

          <button
            id="lightbox-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
            title="Tutup (Esc)"
            aria-label="Tutup galeri"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* MAIN CENTER DISPLAY AREA */}
      <div
        className="relative flex-1 flex items-center justify-center min-h-0 w-full max-w-5xl mx-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Navigation Button */}
        {totalImages > 1 && (
          <button
            id="lightbox-prev-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-150 active:scale-90 shadow-xl cursor-pointer hover:scale-105"
            title="Foto Sebelumnya (Panah Kiri)"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Primary Image */}
        <div className="relative max-h-full max-w-full flex flex-col items-center justify-center">
          <CloudinaryImage
            key={`lightbox-img-${currentIndex}`}
            src={currentImage}
            alt={`${headline} - Foto ${currentIndex + 1}`}
            className="max-h-[68vh] sm:max-h-[72vh] md:max-h-[76vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10 animate-in fade-in zoom-in-95 duration-200"
          />

          {/* Optional Photo Caption Banner */}
          {currentCaption && (
            <div className="mt-2.5 max-w-lg px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs text-slate-200 text-center truncate">
              {currentCaption}
            </div>
          )}
        </div>

        {/* Next Navigation Button */}
        {totalImages > 1 && (
          <button
            id="lightbox-next-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-150 active:scale-90 shadow-xl cursor-pointer hover:scale-105"
            title="Foto Berikutnya (Panah Kanan)"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* BOTTOM THUMBNAIL STRIP */}
      {totalImages > 1 && (
        <div
          className="w-full max-w-2xl mx-auto shrink-0 pt-2 pb-1 overflow-x-auto no-scrollbar z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 px-2">
            {images.map((imgUrl, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={`lightbox-thumb-${idx}`}
                  id={`lightbox-thumbnail-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 h-11 sm:w-18 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-[#5f7adb] ring-2 ring-[#5f7adb]/50 scale-105 opacity-100 shadow-lg'
                      : 'border-white/20 opacity-50 hover:opacity-90 hover:scale-102'
                  }`}
                  title={`Lihat Foto ${idx + 1}`}
                >
                  <CloudinaryImage
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    width={80}
                    height={60}
                    crop="fill"
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-[#5f7adb]/20 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
