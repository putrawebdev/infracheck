import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Hand,
  Camera,
  MapPin,
  Clock,
  User,
  Users,
  ChevronUp,
  Check,
  Copy,
  Plus
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import Spinner from '../ui/Spinner';
import { getReportHeadline } from '../../utils/reportHelpers';
import { formatDateSafe } from '../../utils/dateHelpers';

/**
 * DraggableBottomSheet (Google Maps Native Style)
 * Supports 3 height states / snap points:
 * - 'closed': hidden (selectedReport === null)
 * - 'peek': minimized preview bar (~160px - 190px)
 * - 'expanded': full scrollable detail drawer (~75vh - 85vh)
 */
const DraggableBottomSheet = ({
  id = 'google-maps-bottom-sheet',
  report,
  isOpen = false,
  sheetState = 'peek', // 'peek' | 'expanded'
  onStateChange,
  onClose,
  onConfirmReport,
  isConfirmed = false,
  isConfirming = false,
  onAddPhotoClick,
  onOpenLightbox,
  onOpenAuditDetail,
  onResetMap,
  onSearchFocus,
  activeBottomTab = 'home',
  onTabChange,
  onCreateReportClick,
}) => {
  const navigate = useNavigate();
  const [copiedCoords, setCopiedCoords] = useState(false);
  const contentRef = useRef(null);

  // Sync scroll on expand
  useEffect(() => {
    if (sheetState === 'expanded' && contentRef.current) {
      // Keep scroll state responsive
    }
  }, [sheetState]);

  if (!isOpen || !report) return null;

  const lat = Number(report.latitude) || -6.2383;
  const lng = Number(report.longitude) || 106.9756;
  const locationText = report.location || report.location_address || `Titik Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  const categoryName = report.category_name || report.category?.name || (typeof report.category === 'string' ? report.category : 'Infrastruktur');

  const titleText = getReportHeadline(report);
  const confirmationCount = Number(report.confirmations ?? report.confirmation_count ?? 1);

  const rawImages = (() => {
    let list = [];
    if (Array.isArray(report.images) && report.images.length > 0) {
      list.push(...report.images);
    }
    if (Array.isArray(report.photos) && report.photos.length > 0) {
      list.push(...report.photos.map(p => (typeof p === 'string' ? p : p?.photo_url)).filter(Boolean));
    }
    if (report.photo_url) {
      list.push(report.photo_url);
    }
    const filtered = list.filter(u => typeof u === 'string' && u.trim() && !u.includes('dummyimage.com'));
    return Array.from(new Set(filtered));
  })();

  const baseImages = rawImages.length > 0
    ? rawImages
    : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80'];

  const formatReportDate = (dateStr) => formatDateSafe(dateStr, { dateStyle: 'full' });

  const handleCopyCoords = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${lat}, ${lng}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  // Drag Gesture Threshold Handler
  const handleDragEnd = (event, info) => {
    const offsetThreshold = 40;
    const velocityThreshold = 400;

    // Dragging Downwards
    if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
      if (sheetState === 'expanded') {
        onStateChange && onStateChange('peek');
      } else if (sheetState === 'peek') {
        // Swipe down in peek minimizes or closes
        if (info.offset.y > 100 || info.velocity.y > 600) {
          onClose && onClose();
        }
      }
    }
    // Dragging Upwards
    else if (info.offset.y < -offsetThreshold || info.velocity.y < -velocityThreshold) {
      if (sheetState === 'peek') {
        onStateChange && onStateChange('expanded');
      }
    }
  };

  const getUrgencyConfig = (urgency) => {
    const u = String(urgency || 'medium').toLowerCase();
    switch (u) {
      case 'critical':
      case 'kritis':
        return {
          label: 'Kritis',
          bg: 'bg-red-500/20 text-red-300 border-red-500/40',
          dot: 'bg-red-500 animate-ping'
        };
      case 'high':
      case 'tinggi':
        return {
          label: 'Tinggi',
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-500'
        };
      case 'medium':
      case 'sedang':
        return {
          label: 'Sedang',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500'
        };
      case 'low':
      case 'rendah':
      default:
        return {
          label: 'Rendah',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500'
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(report.urgency);

  return (
    <motion.div
      id={id}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.1, bottom: 0.3 }}
      onDragEnd={handleDragEnd}
      initial={{ y: 300, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        height: sheetState === 'expanded' ? 'calc(84vh - 60px)' : 'auto',
        maxHeight: sheetState === 'expanded' ? 'calc(88vh - 60px)' : '215px',
      }}
      exit={{ y: 500, opacity: 0 }}
      transition={{
        type: 'spring',
        damping: 28,
        stiffness: 320,
        mass: 0.8
      }}
      className="fixed md:absolute bottom-[58px] sm:bottom-[62px] md:bottom-0 left-0 right-0 z-30 w-full bg-[#181a1d] text-slate-100 border-t border-[#343844] rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] flex flex-col pointer-events-auto touch-none select-none md:select-auto"
    >
        {/* FLOATING ACTION BUTTON "+" ANCHORED ABOVE THE BOTTOM SHEET (MOVES WITH SHEET) */}
        <div
          className="absolute -top-16 right-4 sm:right-6 pointer-events-auto z-40"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            id="sheet-floating-plus-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCreateReportClick) {
                onCreateReportClick();
              } else {
                navigate('/report/new');
              }
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#5f7adb] hover:bg-[#4d69d4] active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(95,122,219,0.55)] border border-white/20 transition-all duration-200 group cursor-pointer"
            title="Laporkan Kerusakan Baru"
          >
            <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* TOP HEADER & GRAB HANDLE (CLICKABLE TO TOGGLE) */}
        <div
          id={`${id}-handle-area`}
          onClick={() => {
            onStateChange && onStateChange(sheetState === 'peek' ? 'expanded' : 'peek');
          }}
          className="pt-2 pb-2 px-5 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors rounded-t-[28px] shrink-0 flex flex-col items-center"
        >
          {/* Google Maps Android Grab Handle */}
          <div
            id={`${id}-grab-pill`}
            className="w-10 h-1 bg-slate-500/60 hover:bg-slate-400 active:bg-slate-300 rounded-full cursor-grab active:cursor-grabbing transition-colors my-1"
            title="Geser atau klik untuk toggle"
          />

          {/* Quick Header Summary Bar */}
          <div className="w-full max-w-3xl flex items-start justify-between gap-3 mt-1">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {titleText}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold text-blue-400 bg-blue-950/70 border border-blue-800/60 px-2 py-0.5 rounded-full">
                  {report.tracking_id || 'IC-2026-REPORT'}
                </span>
                <span className="text-xs text-slate-400">
                  {categoryName}
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {locationText}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {/* Urgency Pill */}
              <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${urgencyConfig.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${urgencyConfig.dot}`} />
                <span>{urgencyConfig.label}</span>
              </div>

              {/* Status Badge */}
              <StatusBadge status={report.status || 'new'} size="sm" />
            </div>
          </div>

          {/* Quick Peek Meta Bar (Only in Peek Mode) */}
          {sheetState === 'peek' && (
            <div className="w-full max-w-3xl flex items-center justify-between text-xs text-slate-300 pt-2 pb-1 border-t border-[#292c35] mt-2.5">
              <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[240px] sm:max-w-md">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{locationText}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-blue-300 font-medium">
                  {confirmationCount} konfirmasi
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="hidden sm:inline">Tarik ke atas</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 animate-bounce" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* EXPANDED SCROLLABLE CONTENT BODY */}
        {sheetState === 'expanded' && (
          <div
            ref={contentRef}
            id={`${id}-scrollable-content`}
            className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 max-w-3xl mx-auto w-full touch-auto"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* GOOGLE MAPS PLACE PHOTOS (RESPONSIVE 1, 2, OR 3+ IMAGES) */}
            {baseImages && baseImages.length > 0 && (
              <div
                id={`${id}-photo-gallery-card`}
                className="w-full my-1"
              >
                {baseImages.length === 1 ? (
                  // Single Photo layout (Full width hero card)
                  <div
                    onClick={() => onOpenLightbox && onOpenLightbox(baseImages[0])}
                    className="h-60 sm:h-72 md:h-80 w-full rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                  >
                    <img
                      src={baseImages[0]}
                      alt="Foto Bukti Kerusakan"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 text-xs font-medium text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>Foto Bukti Kerusakan</span>
                    </div>
                  </div>
                ) : baseImages.length === 2 ? (
                  // Two Photos Layout (2 equal columns)
                  <div className="flex gap-2 sm:gap-2.5 h-60 sm:h-72 md:h-80 w-full">
                    <div
                      onClick={() => onOpenLightbox && onOpenLightbox(baseImages[0])}
                      className="flex-1 h-full rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                    >
                      <img
                        src={baseImages[0]}
                        alt="Foto Bukti Kerusakan 1"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div
                      onClick={() => onOpenLightbox && onOpenLightbox(baseImages[1])}
                      className="flex-1 h-full rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                    >
                      <img
                        src={baseImages[1]}
                        alt="Foto Bukti Kerusakan 2"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                ) : (
                  // 3+ Photos Layout (1 tall left + 2 stacked right)
                  <div className="flex gap-2 sm:gap-2.5 h-64 sm:h-80 md:h-96 w-full">
                    {/* Left Column: 1 Tall Primary Image */}
                    <div
                      onClick={() => onOpenLightbox && onOpenLightbox(baseImages[0])}
                      className="flex-[1.6] sm:flex-[1.7] h-full rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                    >
                      <img
                        src={baseImages[0]}
                        alt="Foto Bukti Kerusakan 1"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Right Column: 2 Stacked Images */}
                    <div className="flex-1 flex flex-col gap-2 sm:gap-2.5 h-full">
                      {/* Top Right Image */}
                      <div
                        onClick={() => onOpenLightbox && onOpenLightbox(baseImages[1])}
                        className="flex-1 h-1/2 rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                      >
                        <img
                          src={baseImages[1]}
                          alt="Foto Bukti Kerusakan 2"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Bottom Right Image */}
                      <div
                        onClick={() => onOpenLightbox && onOpenLightbox(baseImages[2])}
                        className="flex-1 h-1/2 rounded-2xl overflow-hidden bg-[#1f2228] border border-[#343844] cursor-pointer shadow-sm active:scale-[0.99] transition-transform relative group"
                      >
                        <img
                          src={baseImages[2]}
                          alt="Foto Bukti Kerusakan 3"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {baseImages.length > 3 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            +{baseImages.length - 2} Foto
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GOOGLE MAPS ANDROID PLACE INFO ROWS */}
            <div className="bg-[#20242a] border border-[#343844] rounded-2xl divide-y divide-[#2d313c] overflow-hidden mt-4 sm:mt-5">
              {/* Address & GPS Row */}
              <div className="p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-snug">
                    {locationText}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Koordinat: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2b2f38] hover:bg-[#393e4a] text-slate-300 text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  title="Salin Koordinat GPS"
                >
                  {copiedCoords ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Description & Detail Row */}
              <div className="p-4 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-300">
                      Dilaporkan oleh {report.reporter_name || 'Warga Terverifikasi'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      #{report.id}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {report.description || 'Tidak ada deskripsi rinci untuk laporan ini.'}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    {formatReportDate(report.created_at)}
                  </p>
                </div>
              </div>

              {/* Community Confirmation Row */}
              <div className="p-4 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">
                    {confirmationCount} Warga Mengonfirmasi Laporan Ini
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Makin banyak konfirmasi mempercepat respon penanganan dinas terkait.
                  </p>
                </div>
              </div>
            </div>

            {/* AUDIT & TIMELINE PREVIEW (IF AVAILABLE) */}
            {report.timeline && Array.isArray(report.timeline) && report.timeline.length > 0 && (
              <div className="bg-[#20242a] border border-[#343844] rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Riwayat Progres Penanganan
                </p>
                <div className="space-y-3 pl-1">
                  {report.timeline.slice(0, 3).map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-200">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.description}</p>
                        <p className="text-[10px] text-slate-500">{item.timestamp} • {item.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIMARY ACTION BUTTONS (GOOGLE MAPS ANDROID PILL BUTTONS) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Button Left: "Saya Juga Merasakan" */}
              <button
                id="drawer-saya-juga-merasakan-btn"
                type="button"
                onClick={() => onConfirmReport && onConfirmReport(report.id)}
                disabled={isConfirming || isConfirmed}
                className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-md ${
                  isConfirmed
                    ? 'bg-emerald-700/80 text-emerald-100 border border-emerald-500/50'
                    : 'bg-[#5F7ADB]/45 hover:bg-[#5F7ADB]/60 text-white border border-[#5F7ADB]/60'
                }`}
              >
                {isConfirming ? (
                  <Spinner size="sm" color="white" />
                ) : isConfirmed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Sudah Dikonfirmasi</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-4 h-4 text-white" />
                    <span>Saya Juga Merasakan</span>
                  </>
                )}
              </button>

              {/* Button Right: "Tambah Foto" */}
              <button
                id="drawer-tambah-foto-btn"
                type="button"
                onClick={() => onAddPhotoClick && onAddPhotoClick()}
                className="w-full py-3.5 px-4 rounded-2xl font-semibold text-xs sm:text-sm bg-[#5F7ADB]/45 hover:bg-[#5F7ADB]/60 text-white border border-[#5F7ADB]/60 flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-md"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Tambah Foto</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
  );
};

export default DraggableBottomSheet;
