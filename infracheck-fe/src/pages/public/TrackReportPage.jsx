import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import Spinner from '../../components/ui/Spinner';
import BottomNavDock from '../../components/public/BottomNavDock';
import CloudinaryImage from '../../components/ui/CloudinaryImage';
import ImageLightbox from '../../components/ui/ImageLightbox';
import { getReportByTrackingId } from '../../api/reports';
import { getReportHeadline, getUrgencyBadge } from '../../utils/reportHelpers';
import { formatLocalDateTime } from '../../utils/dateHelpers';
import Search from '@mui/icons-material/Search';
import CameraAltOutlined from '@mui/icons-material/CameraAltOutlined';
import MapPin from '@mui/icons-material/LocationOnOutlined';
import Layers from '@mui/icons-material/LayersOutlined';
import Check from '@mui/icons-material/Check';
import CheckCircle2 from '@mui/icons-material/CheckCircleOutlined';
import Clock from '@mui/icons-material/AccessTimeOutlined';
import User from '@mui/icons-material/Person';
import Wrench from '@mui/icons-material/BuildOutlined';

const TrackReportPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tracking state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('id') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [trackedReport, setTrackedReport] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  // Initial load
  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      handleSearchTrack(initialId);
    } else {
      setTrackedReport(null);
      setSearchQuery('');
      setSearchError('');
    }
  }, [searchParams]);

  // Execute Tracking search
  const handleSearchTrack = async (targetId) => {
    const idToSearch = (targetId !== undefined ? targetId : searchQuery).trim();
    if (!idToSearch) {
      setSearchError('Silakan masukkan ID Laporan / Kode Tiket');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const found = await getReportByTrackingId(idToSearch);
      if (found) {
        setTrackedReport(found);
        setSearchQuery(found.tracking_id || idToSearch);
        setSearchParams({ id: found.tracking_id || idToSearch });
      } else {
        setTrackedReport(null);
        setSearchError(`Laporan dengan ID "${idToSearch}" tidak ditemukan.`);
      }
    } catch (err) {
      console.error('Error searching report:', err);
      setSearchError('Terjadi kesalahan saat mencari laporan.');
    } finally {
      setIsSearching(false);
    }
  };

  // Safe normalized fields for the active report
  const locationText = trackedReport?.location || trackedReport?.location_address || 'Kota Bekasi, Jawa Barat';
  const categoryText =
    trackedReport?.category_name ||
    trackedReport?.category?.name ||
    (typeof trackedReport?.category === 'string' ? trackedReport.category : 'Infrastruktur Publik');
  const titleText = getReportHeadline(trackedReport);
  const confirmationCount = Number(
    trackedReport?.confirmations ?? trackedReport?.confirmation_count ?? 1
  );
  const reportImages = React.useMemo(() => {
    if (!trackedReport) return [];
    let list = [];
    if (Array.isArray(trackedReport.images) && trackedReport.images.length > 0) {
      list.push(...trackedReport.images);
    }
    if (Array.isArray(trackedReport.photos) && trackedReport.photos.length > 0) {
      list.push(...trackedReport.photos.map(p => (typeof p === 'string' ? p : p?.photo_url)).filter(Boolean));
    }
    if (trackedReport.photo_url) {
      list.push(trackedReport.photo_url);
    }
    const filtered = list.filter(u => typeof u === 'string' && u.trim() && !u.includes('dummyimage.com'));
    const unique = Array.from(new Set(filtered));
    const realPhotos = unique.filter(u => !u.includes('unsplash.com'));
    const chosen = realPhotos.length > 0 ? realPhotos : unique;
    return chosen.length > 0
      ? chosen
      : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'];
  }, [trackedReport]);

  const photoUrl = reportImages[0];
  const urgencyBadge = getUrgencyBadge(trackedReport?.urgency);

  const reportStatus = String(trackedReport?.status || 'new').toLowerCase();
  const isNew = reportStatus === 'new' || reportStatus === 'baru';
  const isProcessing = reportStatus === 'processing' || reportStatus === 'diproses' || reportStatus === 'in_progress';
  const isDone = reportStatus === 'done' || reportStatus === 'selesai' || reportStatus === 'resolved';

  return (
    <PublicLayout>
      <div
        id="track-report-page"
        className="h-full w-full bg-[#111416] text-slate-100 flex flex-col justify-between overflow-hidden relative select-none md:select-auto font-['Poppins',sans-serif]"
      >
        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main
          className={`flex-1 w-full max-w-xl mx-auto overflow-y-auto px-4 pb-24 scrollbar-none ${
            !trackedReport ? 'flex flex-col justify-center' : 'pt-6'
          }`}
        >
          <div className="w-full">
            {/* UNRESULT MODE: EXACTLY CENTERED AS SHOWN IN Track warga */}
            {!trackedReport ? (
              <div className="w-full max-w-md mx-auto space-y-4 text-center my-auto animate-in fade-in duration-200">
                <h2 className="text-lg sm:text-xl font-medium text-white tracking-tight font-['Plus_Jakarta_Sans']">
                  Lacak ID untuk melihat progress
                </h2>

                {/* SEARCH BAR PILL */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchTrack();
                  }}
                  className="relative flex items-center w-full bg-[#181a1d] border border-[#343844] rounded-full p-1.5 shadow-lg focus-within:border-[#5F7ADB] transition-colors"
                >
                  <div className="pl-3.5 pr-2 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (searchError) setSearchError('');
                    }}
                    placeholder="IC-YYYY-XXXXX"
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder:text-slate-500 focus:outline-none pr-2 uppercase tracking-wide"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2.5 rounded-full bg-[#344675] hover:bg-[#3d538c] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {isSearching ? <Spinner size="sm" color="white" /> : 'Track'}
                  </button>
                </form>

                {searchError && (
                  <p className="text-xs text-rose-400 font-medium pt-1">
                    {searchError}
                  </p>
                )}
              </div>
            ) : (
              /* RESULT MODE: REPORT HEADER CARD & REAL STATUS PROGRESS TIMELINE */
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* TOP SEARCH BAR PILL */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchTrack();
                  }}
                  className="relative flex items-center w-full bg-[#181a1d] border border-[#343844] rounded-full p-1.5 shadow-lg focus-within:border-[#5F7ADB] transition-colors"
                >
                  <div className="pl-3.5 pr-2 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (searchError) setSearchError('');
                    }}
                    placeholder="IC-YYYY-XXXXX"
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder:text-slate-500 focus:outline-none pr-2 uppercase tracking-wide"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-5 py-2.5 rounded-full bg-[#344675] hover:bg-[#3d538c] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {isSearching ? <Spinner size="sm" color="white" /> : 'Track'}
                  </button>
                </form>

                {searchError && (
                  <p className="text-xs text-rose-400 font-medium pl-3">
                    {searchError}
                  </p>
                )}

                {/* REPORT SUMMARY CARD (Refined for Mobile Readability & MD3) */}
                <div className="bg-[#191C1E] border border-[#343844] rounded-3xl overflow-hidden shadow-2xl transition-all">
                  {/* Photo Preview Banner (Clickable with Gallery Lightbox) */}
                  <div
                    onClick={() => setLightboxState({ isOpen: true, images: reportImages, currentIndex: 0 })}
                    className="relative w-full h-48 sm:h-56 bg-[#121417] overflow-hidden cursor-pointer group"
                    title="Klik untuk melihat galeri foto penuh"
                  >
                    <CloudinaryImage
                      src={photoUrl}
                      alt={titleText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#191C1E] via-black/20 to-black/50 pointer-events-none" />

                    {/* Top Floating Badges over Photo */}
                    <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1.5 shadow-lg">
                        <span>{trackedReport.tracking_id || 'IC-2026-REPORT'}</span>
                      </div>
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${urgencyBadge.bg}`}
                      >
                        {urgencyBadge.text}
                      </span>
                    </div>

                    {/* Bottom Badges: Category & Gallery Count */}
                    <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191C1E]/90 backdrop-blur-md border border-[#343844] text-xs font-medium text-[#c5c5d4] shadow-md">
                        <Layers className="w-3.5 h-3.5 text-[#8ca0eb] shrink-0" />
                        <span>{categoryText}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white shadow-md">
                        <CameraAltOutlined className="w-3.5 h-3.5 text-blue-400" />
                        <span>{reportImages.length} Foto</span>
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Gallery Strip (If Multiple Images) */}
                  {reportImages.length > 1 && (
                    <div className="p-3 bg-[#131518] border-b border-[#2d313c] flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {reportImages.map((img, idx) => (
                        <button
                          key={`track-thumb-${idx}`}
                          type="button"
                          onClick={() => setLightboxState({ isOpen: true, images: reportImages, currentIndex: idx })}
                          className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-[#343844] hover:border-blue-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm group"
                          title={`Buka Foto ${idx + 1}`}
                        >
                          <CloudinaryImage
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            width={64}
                            height={48}
                            crop="fill"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </button>
                      ))}
                      <span className="text-[11px] text-slate-400 font-medium px-2 shrink-0">
                        Klik untuk perbesar
                      </span>
                    </div>
                  )}

                  {/* Card Body Information */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Report Headline / Title */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#e4e1e6] leading-snug break-words font-['Plus_Jakarta_Sans',sans-serif]">
                        {titleText}
                      </h3>
                      {trackedReport.description && (
                        <p className="mt-2 text-xs sm:text-sm text-[#c5c5d4] leading-relaxed line-clamp-3">
                          {trackedReport.description}
                        </p>
                      )}
                    </div>

                    {/* Location Detail Box */}
                    <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#111416] border border-[#2b313d] text-xs sm:text-sm text-[#c5c5d4]">
                      <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b8b98] block mb-0.5">
                          Lokasi Kerusakan
                        </span>
                        <span className="leading-relaxed break-words text-[#e4e1e6] block font-medium">
                          {locationText}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Community Confirmation Social Proof */}
                    <div className="pt-3.5 border-t border-[#343844] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-[#c5c5d4]">
                        <div className="flex -space-x-2 shrink-0">
                          <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-[#191C1E] flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#191C1E] flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#191C1E] flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <span className="font-medium text-[#c5c5d4] text-xs leading-tight">
                          <strong className="text-[#e4e1e6] font-semibold">{confirmationCount}</strong> warga mengonfirmasi masalah ini
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATUS PROGRESS TIMELINE CARD (REAL DYNAMIC DATA) */}
                <div className="bg-[#1c2026] border border-[#343844] rounded-2xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white tracking-tight">
                      Status Progress
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#202a4d] text-[#8ca0eb] border border-[#354477] font-semibold">
                      {isDone ? 'Selesai' : isProcessing ? 'Sedang Dikerjakan' : 'Laporan Baru'}
                    </span>
                  </div>

                  <div className="relative pl-2 pt-1 pb-2">
                    {/* Vertical Continuous Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#343844]" />

                    {/* Step 1: Laporan Diterima */}
                    <div className="relative flex items-start gap-4 pb-6 group">
                      <div className="w-8 h-8 rounded-full bg-[#354376] text-blue-200 border-2 border-[#1c2026] flex items-center justify-center shrink-0 z-10">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-white leading-tight">
                          Laporan Diterima
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tercatat di sistem • {formatLocalDateTime(trackedReport.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Verifikasi & Penugasan Petugas */}
                    <div className="relative flex items-start gap-4 pb-6 group">
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-[#1c2026] flex items-center justify-center shrink-0 z-10 ${
                          isProcessing || isDone
                            ? 'bg-[#354376] text-blue-200'
                            : isNew
                            ? 'bg-[#344675] text-blue-100 border-[#5F7ADB] shadow-[0_0_10px_rgba(95,122,219,0.4)]'
                            : 'bg-[#262a32] text-slate-500'
                        }`}
                      >
                        {isProcessing || isDone ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={`text-sm font-bold leading-tight ${
                            isNew || isProcessing || isDone ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          Verifikasi Lapangan
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isDone || isProcessing
                            ? 'Laporan terverifikasi oleh petugas dinas'
                            : 'Menunggu peninjauan & verifikasi tim teknis'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Pengerjaan di Lapangan (In Progress) */}
                    <div className="relative flex items-start gap-4 pb-6 group">
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-[#1c2026] flex items-center justify-center shrink-0 z-10 ${
                          isDone
                            ? 'bg-[#354376] text-blue-200'
                            : isProcessing
                            ? 'bg-[#344675] text-blue-100 border-[#5F7ADB] shadow-[0_0_12px_rgba(95,122,219,0.5)]'
                            : 'bg-[#262a32] text-slate-500'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isProcessing ? (
                          <Wrench className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5 space-y-2">
                        <div>
                          <p
                            className={`text-sm font-bold leading-tight ${
                              isProcessing || isDone ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            Pengerjaan di Lapangan
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              isProcessing
                                ? 'text-blue-400 font-medium'
                                : 'text-slate-400'
                            }`}
                          >
                            {isDone
                              ? 'Pengerjaan selesai dilaksanakan'
                              : isProcessing
                              ? 'Status penanganan aktif'
                              : 'Menunggu jadwal pengerjaan'}
                          </p>
                        </div>

                        {/* Crew Note Bubble if processing */}
                        {isProcessing && (
                          <div className="bg-[#242933] border border-[#3b4252] rounded-2xl p-3 text-xs text-slate-200 leading-relaxed shadow-sm">
                            <p>
                              {trackedReport.admin_note ||
                                'Petugas teknis sedang menangani perbaikan infrastruktur di lokasi.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Selesai (Resolved) */}
                    <div className="relative flex items-start gap-4 group">
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-[#1c2026] flex items-center justify-center shrink-0 z-10 ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : 'bg-[#262a32] text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={`text-sm font-bold leading-tight ${
                            isDone ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          Selesai
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isDone
                            ? `Selesai • ${formatLocalDateTime(trackedReport.updated_at || trackedReport.created_at)}`
                            : 'Menunggu verifikasi akhir penyelesaian'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* BOTTOM NAVIGATION DOCK */}
        <BottomNavDock
          activeTab="track"
          onTrackClick={() => {
            setTrackedReport(null);
            setSearchQuery('');
            setSearchError('');
            setSearchParams({});
          }}
        />

        {/* FULL MULTI-PHOTO GALLERY LIGHTBOX MODAL */}
        <ImageLightbox
          isOpen={lightboxState.isOpen}
          onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
          images={lightboxState.images}
          initialIndex={lightboxState.currentIndex}
          report={trackedReport}
        />
      </div>
    </PublicLayout>
  );
};

export default TrackReportPage;
