import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  FileDown,
  Bell,
  Folder,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  Maximize2,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X,
  ArrowUpRight
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { getAllReports, generateReportPDF } from '../../api/reports';
import { getCategories } from '../../api/categories';
import useAuth from '../../hooks/useAuth';
import {
  getReportCoords,
  getMarkerColorConfig,
  BEKASI_DEFAULT_COORDS as defaultMapCenter,
} from '../../utils/reportHelpers';

const createMiniPinIcon = (report) => {
  const { mainColor, lightColor } = getMarkerColorConfig(report);
  const size = 22;
  const html = `
    <div style="position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center;">
      <svg width="${size}" height="${size * 1.33}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.6));">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${mainColor}"/>
        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 19.5 12 29.5 12 29.5C12 29.5 22 19.5 22 12C22 6.47715 17.5228 2 12 2Z" fill="${lightColor}"/>
        <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'dashboard-mini-marker',
    iconSize: [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor: [0, -(size * 1.33)],
  });
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch Reports and Categories
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsRes, categoriesRes] = await Promise.allSettled([
        getAllReports(),
        getCategories(),
      ]);

      if (reportsRes.status === 'fulfilled' && reportsRes.value) {
        const rawReports = Array.isArray(reportsRes.value)
          ? reportsRes.value
          : reportsRes.value?.data || reportsRes.value?.reports || [];
        setReports(Array.isArray(rawReports) ? rawReports : []);
      } else {
        const fallback = await getAllReports();
        setReports(Array.isArray(fallback) ? fallback : fallback?.data || []);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
        const rawCategories = Array.isArray(categoriesRes.value)
          ? categoriesRes.value
          : categoriesRes.value?.data || categoriesRes.value?.categories || [];
        setCategories(Array.isArray(rawCategories) ? rawCategories : []);
      } else {
        const fallbackCats = await getCategories();
        setCategories(Array.isArray(fallbackCats) ? fallbackCats : fallbackCats?.data || []);
      }
    } catch (err) {
      console.warn('Dashboard data fetch notification:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Metrics Summary
  const metrics = useMemo(() => {
    const total = reports.length;
    let urgentCount = 0;
    let processingCount = 0;
    let doneCount = 0;

    reports.forEach((r) => {
      const status = String(r.status || '').toLowerCase();
      const urgency = String(r.urgency || r.priority || '').toLowerCase();

      if (status === 'new' || status === 'baru' || urgency === 'tinggi' || urgency === 'urgent' || urgency === 'high') {
        urgentCount++;
      }
      if (status === 'processing' || status === 'diproses' || status === 'in_progress') {
        processingCount++;
      }
      if (status === 'done' || status === 'selesai' || status === 'resolved') {
        doneCount++;
      }
    });

    return {
      total: total,
      urgent: urgentCount,
      processing: processingCount,
      done: doneCount,
    };
  }, [reports]);

  // Compute Category Distribution
  const categoryStats = useMemo(() => {
    if (categories.length > 0) {
      const totalCount = reports.length || 1;
      return categories.slice(0, 4).map((cat) => {
        const matching = reports.filter(
          (r) => r.category_id === cat.id || r.category?.name === cat.name || r.category === cat.name
        ).length;
        const percent = Math.round((matching / totalCount) * 100);
        return {
          id: cat.id,
          name: cat.name,
          count: matching,
          percentage: percent,
        };
      });
    }

    return [];
  }, [categories, reports]);

  // Filtered reports for search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.title?.toLowerCase().includes(query) ||
        r.location?.toLowerCase().includes(query) ||
        r.category?.name?.toLowerCase().includes(query) ||
        r.category?.toLowerCase?.().includes(query) ||
        r.description?.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  // Reports for display
  const displayReports = useMemo(() => {
    return filteredReports;
  }, [filteredReports]);

  // Handle PDF Export
  const handleGeneratePdf = async () => {
    try {
      setPdfLoading(true);
      const targetId = reports[0]?.id || 'audit-summary';
      const blob = await generateReportPDF(targetId);

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `InfraCheck_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Create a clean printable summary document fallback
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  const openReportDetail = (report) => {
    navigate(`/admin/reports/${report?.id || 1}`);
  };

  const headerLeft = (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c5c5d4]">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="dashboard-search-input"
        type="text"
        placeholder="Search reports..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-[#2e3239] border border-[#444652] text-sm text-slate-100 rounded-full pl-10 pr-4 py-2 placeholder:text-[#6b7280] focus:outline-none focus:border-[#5f7adb] focus:ring-1 focus:ring-[#5f7adb] transition-all"
      />
    </div>
  );

  const headerRight = (
    <button
      id="generate-pdf-btn"
      type="button"
      onClick={handleGeneratePdf}
      disabled={pdfLoading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide bg-[#5f7adb] hover:bg-[#4b66cb] text-white transition-colors disabled:opacity-50 shadow-sm"
    >
      {pdfLoading ? (
        <Spinner size="sm" color="white" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span>Generate PDF Audit</span>
    </button>
  );

  return (
    <AdminLayout headerLeft={headerLeft} headerRight={headerRight} maxWidth="max-w-none">
      <div id="dashboard-page" className="space-y-6 animate-in fade-in duration-150">
        {/* Welcome Greeting Header */}
        <div id="welcome-header" className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e1e2e5]">
            Selamat Pagi, {user?.name?.split(' ')[0] || 'Admin'}
          </h2>
          <p className="text-sm text-[#c5c5d4]">
            Here is the overview of today's infrastructure reports.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="text-xs font-semibold underline hover:text-white"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Metrics Grid Cards (4 Metrics) */}
        <div id="metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Laporan */}
          <div
            id="metric-total-laporan"
            className="relative overflow-hidden bg-[#191c1e] border border-[#444652] rounded-xl p-5 shadow-xs transition-all hover:border-[#5f7adb]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-[#c5c5d4] uppercase tracking-wider">
                TOTAL LAPORAN
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#5f7adb]/10 flex items-center justify-center text-[#5f7adb]">
                <Folder className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#e1e2e5]">
              {loading ? <Spinner size="sm" color="blue" /> : metrics.total.toLocaleString()}
            </div>
          </div>

          {/* Card 2: Laporan Mendesak */}
          <div
            id="metric-laporan-mendesak"
            className="relative overflow-hidden bg-[#191c1e] border border-[#444652] rounded-xl p-5 shadow-xs transition-all hover:border-[#e57373]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-[#c5c5d4] uppercase tracking-wider">
                LAPORAN MENDESAK
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#e57373]/10 flex items-center justify-center text-[#e57373]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#e57373]">
              {loading ? <Spinner size="sm" color="red" /> : metrics.urgent.toLocaleString()}
            </div>
          </div>

          {/* Card 3: Sedang Diproses */}
          <div
            id="metric-sedang-diproses"
            className="relative overflow-hidden bg-[#191c1e] border border-[#444652] rounded-xl p-5 shadow-xs transition-all hover:border-[#ffb74d]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-[#c5c5d4] uppercase tracking-wider">
                SEDANG DIPROSES
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#ffb74d]/10 flex items-center justify-center text-[#ffb74d]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#ffb95a]">
              {loading ? <Spinner size="sm" color="blue" /> : metrics.processing.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Selesai */}
          <div
            id="metric-selesai"
            className="relative overflow-hidden bg-[#191c1e] border border-[#444652] rounded-xl p-5 shadow-xs transition-all hover:border-[#81c784]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-[#c5c5d4] uppercase tracking-wider">
                SELESAI
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#81c784]/10 flex items-center justify-center text-[#81c784]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#81c784]">
              {loading ? <Spinner size="sm" color="emerald" /> : metrics.done.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Content Grid: Recent Reports & Map Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Recent Reports Table Section (8 cols) */}
          <div
            id="recent-reports-card"
            className="lg:col-span-8 bg-[#191c1e] border border-[#444652] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#444652]/60 mb-4">
                <h3 className="text-lg font-semibold text-[#e1e2e5]">Laporan Terkini</h3>
                <Link
                  id="view-all-reports-link"
                  to="/admin/reports"
                  className="text-xs font-semibold text-[#5f7adb] hover:underline"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <Spinner size="lg" color="blue" />
                  <p className="text-xs text-slate-400 font-medium">Memuat data laporan...</p>
                </div>
              ) : displayReports.length === 0 ? (
                <EmptyState
                  id="dashboard-reports-empty"
                  title="Tidak ada laporan"
                  description="Belum ada laporan infrastruktur publik yang cocok dengan pencarian Anda."
                  actionLabel="Reset Pencarian"
                  onAction={() => setSearchQuery('')}
                  className="bg-[#2e3239]/40 border-[#444652]"
                />
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#444652] text-[11px] font-medium text-[#c5c5d4] uppercase tracking-wider">
                        <th className="py-3 px-3">Lokasi</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3">Urgensi / Status</th>
                        <th className="py-3 px-3">Konfirmasi</th>
                        <th className="py-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#444652]/40 text-xs sm:text-sm text-slate-200">
                      {displayReports.map((report, idx) => {
                        const locationStr = report.location || report.title || report.address || 'Lokasi tidak tersedia';
                        const categoryStr = report.category?.name || report.category_name || report.category || 'Infrastruktur';
                        const urgencyStr = report.urgency || report.priority || (report.status === 'new' ? 'Tinggi' : 'Sedang');
                        const confirmStr = report.confirmations !== undefined ? `${report.confirmations} Warga` : (report.votes_count !== undefined ? `${report.votes_count} Warga` : '0 Warga');

                        return (
                          <tr key={report.id || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-3 font-medium text-[#e1e2e5] max-w-[180px] truncate">
                              {locationStr}
                            </td>
                            <td className="py-3.5 px-3 text-[#c5c5d4]">
                              {categoryStr}
                            </td>
                            <td className="py-3.5 px-3">
                              <StatusBadge status={report.status || urgencyStr} size="sm" />
                            </td>
                            <td className="py-3.5 px-3 text-[#c5c5d4] whitespace-nowrap">
                              {confirmStr}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <Link
                                id={`detail-btn-${report.id || idx}`}
                                to={`/admin/reports/${report.id || idx + 1}`}
                                className="text-xs font-semibold text-[#5f7adb] hover:underline"
                              >
                                Detail
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Map Preview Section (4 cols) */}
          <div
            id="map-preview-card"
            className="lg:col-span-4 bg-[#191c1e] border border-[#444652] rounded-xl overflow-hidden shadow-xs flex flex-col h-full"
          >
            <div className="p-5 border-b border-[#444652] shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-[#e1e2e5]">
                  Peta Sebaran Laporan
                </h3>
              </div>
              <p className="text-xs text-[#c5c5d4] mt-1">
                Titik laporan terkini di wilayah operasi.
              </p>
            </div>

            {/* Real Interactive Leaflet Mini Map - Stretches to match left card height */}
            <div className="relative flex-1 min-h-[260px] w-full bg-[#111416] overflow-hidden group">
              <MapContainer
                center={defaultMapCenter}
                zoom={12}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                className="w-full h-full"
                style={{ width: '100%', height: '100%', minHeight: '260px', zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                {reports.slice(0, 30).map((report, idx) => {
                  const coords = getReportCoords(report);
                  const colorCfg = getMarkerColorConfig(report);
                  return (
                    <Marker
                      key={`mini-map-pin-${report.id || idx}`}
                      position={coords}
                      icon={createMiniPinIcon(report)}
                      eventHandlers={{
                        click: () => {
                          navigate('/admin/map');
                        },
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                        <div className="bg-[#191c1e] text-white text-xs px-2.5 py-1 rounded-lg font-semibold border border-[#444652] shadow-lg flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${colorCfg.dotClass}`} />
                          <span>{report.title || report.location}</span>
                        </div>
                      </Tooltip>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Status Overlay Badge */}
              <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
                <div className="px-2.5 py-1 rounded-full bg-[#191c1e]/90 border border-[#444652] backdrop-blur-md text-[11px] font-medium text-slate-200 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{reports.length} Titik Terpantau</span>
                </div>
              </div>

              {/* Expand / Perbesar Button -> Routes to /admin/map */}
              <button
                id="map-expand-btn"
                type="button"
                onClick={() => navigate('/admin/map')}
                className="absolute bottom-3 right-3 z-[1000] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191c1e]/90 hover:bg-[#5f7adb] text-white border border-[#444652] text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 cursor-pointer"
                aria-label="Perbesar peta"
                title="Perbesar Peta"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Distribution Card (Distribusi Kategori) */}
        <div
          id="category-distribution-card"
          className="bg-[#191c1e] border border-[#444652] rounded-xl p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#444652]/60 mb-6">
            <h3 className="text-lg font-semibold text-[#e1e2e5]">Persentase Kategori</h3>
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-[#5f7adb] hover:underline"
            >
              Kelola Kategori
            </Link>
          </div>

          <div className="space-y-5">
            {categoryStats.map((cat) => (
              <div key={cat.id || cat.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#c5c5d4]">{cat.name}</span>
                  <span className="text-[#c5c5d4]">{cat.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-[#323537] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5f7adb] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      <Modal
        id="report-detail-modal"
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Laporan Infrastruktur"
        maxWidth="max-w-xl"
        footer={
          <Button
            id="close-detail-modal-btn"
            variant="secondary"
            size="sm"
            onClick={() => setDetailModalOpen(false)}
          >
            Tutup
          </Button>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Lokasi
              </span>
              <p className="text-base font-semibold text-slate-900">
                {selectedReport.location || selectedReport.title || 'Lokasi Belum Ditentukan'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Kategori
                </span>
                <p className="text-sm font-medium text-slate-800">
                  {selectedReport.category?.name || selectedReport.category_name || selectedReport.category || '-'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <StatusBadge status={selectedReport.status || 'new'} size="sm" />
              </div>
            </div>

            {selectedReport.description && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Deskripsi Masalah
                </span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedReport.description}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Konfirmasi: {selectedReport.confirmations || 0} Warga</span>
              <span>ID: #{selectedReport.id || '-'}</span>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default DashboardPage;
