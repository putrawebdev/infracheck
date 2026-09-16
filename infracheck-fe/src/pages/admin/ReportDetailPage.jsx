import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Eye,
  Download,
  Share2,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  FileText,
  Search,
  Filter,
  Sparkles,
  Maximize2,
  X,
  Trash2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import StatusUpdater from '../../components/admin/StatusUpdater';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import CloudinaryImage from '../../components/ui/CloudinaryImage';
import { getReportById, generateReportPDF, deleteReport, getAllReports, normalizeReport } from '../../api/reports';
import useAuth from '../../hooks/useAuth';
import { formatDateSafe, formatDateTimeSafe, formatLocalDateTime } from '../../utils/dateHelpers';

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  // Related Audit History List State
  const [historyReports, setHistoryReports] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [searchHistory, setSearchHistory] = useState('');

  // Fetch Report by ID
  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      let targetReport = null;

      if (id) {
        const response = await getReportById(id);
        const reportData = response?.data || response?.report || response;
        if (reportData && (reportData.id || reportData.title || reportData.tracking_id)) {
          targetReport = reportData;
        }
      }

      // If id not specified in route, or specific id lookup returned null, load from full reports list
      if (!targetReport) {
        const allRes = await getAllReports();
        const list = Array.isArray(allRes) ? allRes : allRes?.data || [];
        if (id) {
          targetReport = list.find((r) => String(r.id) === String(id) || r.tracking_id === id) || null;
        }
        if (!targetReport && list.length > 0) {
          targetReport = list[0];
        }
      }

      if (!targetReport) {
        setError('Belum ada data laporan yang tersedia.');
        setReport(null);
        return;
      }

      const normalized = normalizeReport(targetReport);
      setReport(normalized);
    } catch (err) {
      console.error('Error fetching report detail:', err);
      setError('Gagal memuat rincian laporan.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all reports for the audit history list below
  const fetchAllHistory = async () => {
    try {
      const res = await getAllReports();
      const raw = Array.isArray(res) ? res : res?.data || res?.reports || [];
      setHistoryReports(Array.isArray(raw) ? raw.map(normalizeReport) : []);
    } catch {
      setHistoryReports([]);
    }
  };

  useEffect(() => {
    fetchReportDetail();
    fetchAllHistory();
  }, [id]);

  const isReportDone = (() => {
    const s = String(report?.status || '').toLowerCase().trim();
    return s === 'done' || s === 'selesai' || s === 'resolved';
  })();

  // Handle PDF Export (Actual Blob Download)
  const handleDownloadPDF = async () => {
    if (!report) return;
    try {
      setPdfGenerating(true);
      const blob = await generateReportPDF(report.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Audit-Report-${report.tracking_id || report.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatusSuccessMessage('Dokumen PDF Audit Berhasil Diunduh.');
        setTimeout(() => setStatusSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Gagal mengunduh dokumen PDF audit.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Handle Delete Report (When Status is Done)
  const handleDeleteReport = async () => {
    if (!report) return;
    try {
      setIsDeleting(true);
      await deleteReport(report.id);
      setDeleteModalOpen(false);
      navigate('/admin/dashboard', {
        replace: true,
        state: { message: `Laporan #${report.tracking_id} berhasil dihapus.` },
      });
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Gagal menghapus laporan dari sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Updater Callback
  const handleStatusUpdated = (newStatusData) => {
    const updatedStatus = newStatusData.status || newStatusData;
    const note = newStatusData.note || 'Status diperbarui oleh Administrator.';

    setReport((prev) => {
      if (!prev) return prev;
      const newTimelineItem = {
        id: Date.now(),
        status: updatedStatus,
        title: `Status Diubah Menjadi ${updatedStatus.toUpperCase()}`,
        description: note,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB (Hari ini)',
        actor: user?.name || 'Administrator'
      };

      return {
        ...prev,
        status: updatedStatus,
        timeline: [newTimelineItem, ...(prev.timeline || [])]
      };
    });

    setStatusSuccessMessage(`Status audit laporan berhasil diperbarui menjadi "${updatedStatus.toUpperCase()}".`);
    setTimeout(() => setStatusSuccessMessage(''), 4000);
  };

  // Filtered History Reports Table
  const filteredHistory = historyReports.filter((item) => {
    const sMatch = !searchHistory ||
      item.title?.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.tracking_id?.toLowerCase().includes(searchHistory.toLowerCase());

    const cMatch = filterCategory === 'all' ||
      item.category_name?.toLowerCase() === filterCategory.toLowerCase() ||
      item.category?.name?.toLowerCase() === filterCategory.toLowerCase();

    const uMatch = filterUrgency === 'all' ||
      item.urgency?.toLowerCase() === filterUrgency.toLowerCase();

    return sMatch && cMatch && uMatch;
  });

  // Urgency badge helper
  const getUrgencyBadge = (urgency) => {
    const u = String(urgency || '').toLowerCase();
    if (u === 'critical' || u === 'kritis') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#93000a] text-[#ffdad6] border border-red-800 shadow-xs">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    }
    if (u === 'high' || u === 'tinggi') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffb95a] text-[#744900] shadow-xs">
          <AlertCircle className="w-3 h-3" />
          High
        </span>
      );
    }
    if (u === 'medium' || u === 'sedang') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#354477] text-[#a4b3ed]">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#343438] text-[#c6c5d0] border border-[#45464f]">
        Low
      </span>
    );
  };

  const headerLeft = (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c5c5d4]">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="detail-search-input"
        type="text"
        placeholder="Search reports..."
        value={searchHistory}
        onChange={(e) => setSearchHistory(e.target.value)}
        className="w-full bg-[#2e3239] border border-[#444652] text-sm text-slate-100 rounded-full pl-10 pr-4 py-2 placeholder:text-[#6b7280] focus:outline-none focus:border-[#5f7adb] focus:ring-1 focus:ring-[#5f7adb] transition-all"
      />
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
      {isReportDone && (
        <button
          id="delete-done-report-top-btn"
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          disabled={isDeleting || loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          title="Hapus laporan ini dari sistem"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Hapus Laporan</span>
        </button>
      )}

      <button
        id="generate-pdf-audit-top-btn"
        type="button"
        onClick={handleDownloadPDF}
        disabled={pdfGenerating || loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide bg-[#5f7adb] hover:bg-[#4b66cb] text-white transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
      >
        {pdfGenerating ? (
          <Spinner size="sm" color="white" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span>Generate PDF Audit</span>
      </button>
    </div>
  );

  return (
    <AdminLayout headerLeft={headerLeft} headerRight={headerRight} maxWidth="max-w-none">
      <div id="report-detail-page" className="space-y-6 pb-16">
        {/* Status Update / Success Notification Banner */}
        {statusSuccessMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusSuccessMessage}</span>
            </div>
            <button onClick={() => setStatusSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-16 bg-[#191c1e] border border-[#444652] rounded-2xl">
            <Spinner size="lg" color="blue" />
            <p className="mt-3 text-sm text-[#c5c5d4]">Memuat rincian laporan & berkas audit...</p>
          </div>
        )}

        {/* MAIN REPORT DETAIL CONTENT - 3 ALIGNED ROWS */}
        {!loading && report && (
          <div className="space-y-6">
            {/* ROW 1: Report Hero Detail & Status / Tindak Lanjut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* PRIMARY REPORT HERO CARD (Left: 2 cols) */}
              <div className="lg:col-span-2 flex flex-col">
                <div
                  id="report-hero-card"
                  className="bg-[#191C1E] border border-[#444652] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden h-full flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badge & Tracking ID header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#444652]/70">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#202a4d] text-[#dce1ff] border border-[#354477] font-mono text-xs font-bold rounded-lg tracking-wider">
                          {report.tracking_id}
                        </span>
                        <span className="text-xs text-[#c6c5d0] flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#5f7adb]" />
                          {formatDateSafe(report.date_reported || report.created_at, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getUrgencyBadge(report.urgency)}
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                    </div>

                    {/* Title & Physical Location */}
                    <div className="mt-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#e4e1e6] tracking-tight">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-[#c6c5d0]">
                        <MapPin className="w-4 h-4 text-[#5f7adb] shrink-0" />
                        <span>{report.location}</span>
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div className="mt-5 bg-[#292a2d]/80 border border-[#444652]/80 p-4 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#c6c5d0] mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#5f7adb]" />
                        Deskripsi Kerusakan Infrastruktur
                      </h4>
                      <p className="text-xs sm:text-sm text-[#e4e1e6] leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#444652]/70 text-xs">
                    <div className="bg-[#111416]/60 p-3 rounded-xl border border-[#444652]/40">
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">Kategori</span>
                      <span className="font-semibold text-[#e4e1e6] mt-0.5 block truncate">
                        {report.category_name}
                      </span>
                    </div>

                    <div className="bg-[#111416]/60 p-3 rounded-xl border border-[#444652]/40">
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">Konfirmasi Warga</span>
                      <span className="font-semibold text-emerald-400 mt-0.5 block">
                        {report.confirmations} Orang
                      </span>
                    </div>

                    <div className="bg-[#111416]/60 p-3 rounded-xl border border-[#444652]/40">
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">Foto Bukti</span>
                      <span className="font-semibold text-[#a4b3ed] mt-0.5 block">
                        {report.images?.length || 0} Terlampir
                      </span>
                    </div>

                    <div className="bg-[#111416]/60 p-3 rounded-xl border border-[#444652]/40">
                      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block">Pelapor</span>
                      <span className="font-semibold text-[#e4e1e6] mt-0.5 block truncate">
                        {report.reporter_name || 'Warga'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTEGRATED STATUS UPDATER COMPONENT (Right: 1 col - Material You Design) */}
              <div className="lg:col-span-1 flex flex-col">
                <div
                  id="sidebar-status-updater-card"
                  className="bg-[#191C1E] border border-[#444652] rounded-2xl p-5 sm:p-6 shadow-md h-full flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle Ambient Glow */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#5f7adb]/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#444652]/70">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <h3 className="text-lg font-bold text-[#e4e1e6] tracking-tight">
                            Status & Tindak Lanjut
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Status Updater Form */}
                    <StatusUpdater
                      id={`status-updater-${report.id}`}
                      reportId={report.id}
                      currentStatus={report.status}
                      onStatusUpdated={handleStatusUpdated}
                    />

                    {/* Conditional Delete Option for Completed Reports */}
                    {isReportDone && (
                      <div className="mt-4 pt-3 border-t border-[#444652]/60 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Status pengerjaan selesai.</span>
                        <button
                          id="delete-done-report-card-btn"
                          type="button"
                          onClick={() => setDeleteModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Laporan</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Photo Evidence Gallery (Full Width - aligned with Status Audit & Container) */}
            <div className="w-full">
              <div
                id="report-photo-gallery"
                className="bg-[#191C1E] border border-[#444652] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#5f7adb]" />
                      <h3 className="text-base font-bold text-[#e4e1e6]">
                        Galeri Bukti ({report.images?.length || 0})
                      </h3>
                    </div>
                    <span className="text-xs text-[#6b7280]">Klik foto untuk memperbesar</span>
                  </div>

                  {/* Active Highlight Image */}
                  {report.images && report.images.length > 0 ? (
                    <div className="space-y-3">
                      <div
                        className="relative h-64 sm:h-96 md:h-[420px] w-full rounded-xl overflow-hidden border border-[#444652] group cursor-pointer bg-black"
                        onClick={() => setImageModalOpen(true)}
                      >
                        <CloudinaryImage
                          src={report.images[activeImageIndex]}
                          alt={`Bukti Laporan ${report.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-xs text-white flex items-center gap-1.5 font-medium">
                            <Maximize2 className="w-4 h-4 text-[#5f7adb]" />
                            Buka Gambar Resolusi Penuh
                          </span>
                        </div>
                      </div>

                      {/* Thumbnail Thumbnails Row */}
                      {report.images.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                          {report.images.map((imgUrl, index) => (
                            <button
                              key={`thumb-${index}`}
                              type="button"
                              onClick={() => setActiveImageIndex(index)}
                              className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${activeImageIndex === index
                                ? 'border-[#5f7adb] ring-2 ring-[#5f7adb]/30 scale-102'
                                : 'border-[#444652] opacity-60 hover:opacity-100'
                                }`}
                            >
                              <CloudinaryImage
                                src={imgUrl}
                                alt={`Thumbnail ${index + 1}`}
                                width={96}
                                height={64}
                                crop="fill"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#292a2d] rounded-xl text-xs text-[#6b7280]">
                      Tidak ada foto bukti yang terlampir pada laporan ini.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 3: Riwayat & Log Audit Lapangan (Full Width aligned with Koordinat Lokasi Card) */}
            <div className="w-full">
              <div
                id="report-timeline-history"
                className="bg-[#191C1E] border border-[#444652] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col"
              >
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#444652]/70">
                  <Clock className="w-5 h-5 text-[#5f7adb]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#e4e1e6]">
                      Riwayat & Log Audit Lapangan
                    </h3>
                  </div>
                </div>

                {/* Timeline vertical chain */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#444652] flex-1">
                  {report.timeline && report.timeline.length > 0 ? (
                    report.timeline.map((event, idx) => (
                      <div key={event.id || idx} className="relative group">
                        {/* Node circle marker */}
                        <span className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-[#5f7adb] ring-4 ring-[#191C1E] group-hover:scale-125 transition-transform" />

                        <div className="bg-[#292a2d] border border-[#444652]/70 rounded-xl p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                            <h4 className="text-xs sm:text-sm font-bold text-[#e4e1e6]">
                              {event.title}
                            </h4>
                            <span className="text-[10px] text-[#a4b3ed] font-mono">
                              {event.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-[#c6c5d0] mt-1 leading-relaxed">
                            {event.description}
                          </p>
                          {event.actor && (
                            <div className="mt-2 text-[10px] text-[#6b7280] flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-[#5f7adb]" />
                              <span>Petugas/Aktor: {event.actor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative group">
                      <span className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-[#5f7adb] ring-4 ring-[#191C1E]" />
                      <div className="bg-[#292a2d] border border-[#444652]/70 rounded-xl p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#e4e1e6]">
                            Laporan Diterima Sistem
                          </h4>
                          <span className="text-[10px] text-[#a4b3ed] font-mono">
                            {formatDateSafe(report.date_reported || report.created_at, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#c6c5d0] mt-1 leading-relaxed">
                          Laporan infrastruktur berhasil tercatat ke dalam basis data sistem InfraCheck dan menunggu proses tindak lanjut petugas.
                        </p>
                        <div className="mt-2 text-[10px] text-[#6b7280] flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-[#5f7adb]" />
                          <span>Petugas/Aktor: {report.reporter_name || 'Warga'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: AUDIT HISTORY LIST TABLE (Matching Figma "Audit History" Table Specs) */}
        <div id="audit-history-table-section" className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e1e2e5]">
                Daftar Audit
              </h2>
            </div>
          </div>

          {/* Filters Bar (Matching filters-bar-10 in Figma design) */}
          <div
            id="audit-filters-bar"
            className="bg-[#191c1e] border border-[#444652] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Category Filter Select */}
              <div>
                <label className="block text-[11px] font-semibold text-[#c6c5d0] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#292a2d] text-[#e4e1e6] border border-[#444652] rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-[#5f7adb]"
                >
                  <option value="all">All Categories</option>
                  <option value="Road Surface">Road Surface</option>
                  <option value="Bridge/Structural">Bridge/Structural</option>
                  <option value="Utility/Drainage">Utility/Drainage</option>
                  <option value="Public Facility">Public Facility</option>
                </select>
              </div>

              {/* Urgency Filter Select */}
              <div>
                <label className="block text-[11px] font-semibold text-[#c6c5d0] uppercase tracking-wider mb-1">
                  Urgency
                </label>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="bg-[#292a2d] text-[#e4e1e6] border border-[#444652] rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-[#5f7adb]"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Quick Search within Table */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-[#6b7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Search Audit History..."
                className="w-full bg-[#2e3239] text-xs text-[#e1e2e5] placeholder-[#6b7280] rounded-full pl-9 pr-3 py-2 border border-[#444652] focus:outline-none focus:border-[#5f7adb]"
              />
            </div>
          </div>

          {/* Table Container (Matching data-table-list-54) */}
          <div className="bg-[#191c1e] border border-[#444652] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#292a2d] border-b border-[#444652] text-[#c6c5d0] font-semibold">
                    <th className="py-3 px-4">Tracking ID</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Confirmations</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Reported</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444652]/50 text-[#e4e1e6]">
                  {filteredHistory.map((item) => (
                    <tr
                      key={`row-${item.id}`}
                      className={`hover:bg-[#22252a] transition-colors ${String(item.id) === String(id) ? 'bg-[#202a4d]/40' : ''
                        }`}
                    >
                      <td className="py-3 px-4 font-mono text-[#dce1ff]">
                        {item.tracking_id || `IC-2026-${String(item.id).padStart(5, '0')}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#e4e1e6]">{item.title}</div>
                        <div className="text-[11px] text-[#c6c5d0] font-mono">{item.latitude}, {item.longitude}</div>
                      </td>
                      <td className="py-3 px-4 text-[#e4e1e6]">{item.category_name || item.category?.name}</td>
                      <td className="py-3 px-4">{getUrgencyBadge(item.urgency)}</td>
                      <td className="py-3 px-4 text-[#c6c5d0]">{item.confirmations || 0}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-[#c6c5d0]">
                        {formatDateSafe(item.date_reported || item.created_at, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }, 'id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/reports/${item.id}`}
                            className="p-1.5 text-[#c6c5d0] hover:text-white hover:bg-[#2e3239] rounded-lg transition-colors"
                            title="Lihat Detail Laporan"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/admin/reports/${item.id}`);
                              handleDownloadPDF();
                            }}
                            className="p-1.5 text-[#c6c5d0] hover:text-[#5f7adb] hover:bg-[#2e3239] rounded-lg transition-colors cursor-pointer"
                            title="Unduh Lembar Audit PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="bg-[#1f1f23] border-t border-[#444652]/70 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#c6c5d0]">
              <span>Showing 1 to {filteredHistory.length} of {historyReports.length} entries</span>
              <div className="flex items-center gap-1">
                <button type="button" className="w-6 h-6 rounded-full flex items-center justify-center text-[#c6c5d0] hover:bg-[#2e3239] cursor-pointer">
                  &lt;
                </button>
                <button type="button" className="w-6 h-6 rounded-full bg-[#354477] text-[#a4b3ed] font-bold flex items-center justify-center cursor-pointer">
                  1
                </button>
                <button type="button" className="w-6 h-6 rounded-full text-[#c6c5d0] hover:bg-[#2e3239] flex items-center justify-center cursor-pointer">
                  2
                </button>
                <button type="button" className="w-6 h-6 rounded-full text-[#c6c5d0] hover:bg-[#2e3239] flex items-center justify-center cursor-pointer">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL IMAGE LIGHTBOX MODAL */}
      <Modal
        id="image-lightbox-modal"
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title={`Foto Bukti: ${report?.title || ''}`}
        maxWidth="max-w-4xl"
      >
        {report && report.images && report.images[activeImageIndex] && (
          <div className="space-y-4 text-center">
            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-black flex items-center justify-center">
              <CloudinaryImage
                src={report.images[activeImageIndex]}
                alt="Foto Resolusi Penuh"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span>Gambar {activeImageIndex + 1} dari {report.images.length}</span>
              <span>Lokasi: {report.location}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        id="delete-report-confirm-modal"
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        title="Konfirmasi Hapus Laporan"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              id="cancel-delete-report-btn"
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              id="confirm-delete-report-btn"
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteReport}
              isLoading={isDeleting}
            >
              Ya, Hapus Laporan
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus laporan <strong className="text-white font-mono">{report?.tracking_id}</strong>?
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-relaxed">
            Laporan yang berstatus <strong>Selesai</strong> dapat dihapus dari basis data. Semua arsip foto bukti dan riwayat penanganan laporan ini akan dibersihkan secara permanen.
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default ReportDetailPage;
