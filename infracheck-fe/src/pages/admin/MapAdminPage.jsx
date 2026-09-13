import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  FileDown,
  Bell,
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Filter,
  RefreshCw,
  X,
  Users,
  Image as ImageIcon,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Navigation,
  Info,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Sparkles
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

const createAdminPinIcon = (report, isSelected) => {
  const { mainColor, lightColor } = getMarkerColorConfig(report);
  const size = isSelected ? 36 : 28;

  const html = `
    <div style="position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center;">
      ${isSelected ? `<div style="position: absolute; width: ${size + 14}px; height: ${size + 14}px; border-radius: 50%; background-color: ${mainColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <svg width="${size}" height="${size * 1.33}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.7));">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.5 12 32 12 32C12 32 24 20.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${mainColor}"/>
        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 19.5 12 29.5 12 29.5C12 29.5 22 19.5 22 12C22 6.47715 17.5228 2 12 2Z" fill="${lightColor}"/>
        <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'admin-leaflet-marker',
    iconSize: [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor: [0, -(size * 1.33)],
  });
};

const LeafletAdminMapController = ({ selectedReport, mapInstanceRef }) => {
  const map = useMap();

  useEffect(() => {
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }
  }, [map, mapInstanceRef]);

  useEffect(() => {
    if (selectedReport) {
      const coords = getReportCoords(selectedReport);
      map.flyTo(coords, 15, { animate: true, duration: 0.8 });
    }
  }, [selectedReport, map]);

  return null;
};

const MapAdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Data
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all | new | processing | done
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  // Interactive Map States
  const [selectedReport, setSelectedReport] = useState(null);
  const [hoveredReport, setHoveredReport] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapType, setMapType] = useState('satellite'); // satellite | vector | terrain
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // PDF Export state
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Fetch Reports and Categories
  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsRes, categoriesRes] = await Promise.allSettled([
        getAllReports(),
        getCategories(),
      ]);

      let loadedReports = [];
      if (reportsRes.status === 'fulfilled' && reportsRes.value) {
        const rawReports = Array.isArray(reportsRes.value)
          ? reportsRes.value
          : reportsRes.value?.data || reportsRes.value?.reports || [];
        if (Array.isArray(rawReports)) {
          loadedReports = rawReports.map((r, index) => {
            return {
              ...r,
              id: r.id || index + 1,
              title: r.title || r.location || 'Laporan Infrastruktur',
              location: r.location || 'Lokasi tidak tersedia',
              category_name: r.category?.name || r.category_name || r.category || 'Infrastruktur',
              category: typeof r.category === 'object' ? r.category : { name: r.category_name || r.category || 'Infrastruktur' },
              status: String(r.status || 'new').toLowerCase(),
              confirmations: r.confirmations || r.confirmation_count || 0,
              photos_count: r.photos_count || r.images?.length || 0,
              map_x: r.map_x || 50,
              map_y: r.map_y || 50,
            };
          });
        }
      }

      setReports(loadedReports);

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
        const rawCategories = Array.isArray(categoriesRes.value)
          ? categoriesRes.value
          : categoriesRes.value?.data || categoriesRes.value?.categories || [];
        setCategories(Array.isArray(rawCategories) ? rawCategories : []);
      }
    } catch (err) {
      console.warn('Map data fetch note:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search match
      const titleMatch = String(report.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const locationMatch = String(report.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = String(report.category_name || report.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = String(report.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const queryPass = !searchQuery || titleMatch || locationMatch || categoryMatch || descMatch;

      // Status match
      const statusStr = String(report.status || '').toLowerCase();
      let statusPass = true;
      if (selectedStatus === 'new') {
        statusPass = statusStr === 'new' || statusStr === 'baru';
      } else if (selectedStatus === 'processing') {
        statusPass = statusStr === 'processing' || statusStr === 'diproses' || statusStr === 'in_progress';
      } else if (selectedStatus === 'done') {
        statusPass = statusStr === 'done' || statusStr === 'selesai' || statusStr === 'resolved';
      }

      // Category match
      let catPass = true;
      if (selectedCategory !== 'all') {
        const catName = String(report.category?.name || report.category_name || '').toLowerCase();
        catPass = catName === selectedCategory.toLowerCase();
      }

      return queryPass && statusPass && catPass;
    });
  }, [reports, searchQuery, selectedStatus, selectedCategory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  // Statistics counters
  const statusStats = useMemo(() => {
    let newCount = 0;
    let processingCount = 0;
    let doneCount = 0;

    reports.forEach((r) => {
      const s = String(r.status || '').toLowerCase();
      if (s === 'new' || s === 'baru') newCount++;
      else if (s === 'processing' || s === 'diproses' || s === 'in_progress') processingCount++;
      else if (s === 'done' || s === 'selesai' || s === 'resolved') doneCount++;
    });

    return { total: reports.length, newCount, processingCount, doneCount };
  }, [reports]);

  // Map Controls Helpers (Leaflet API)
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };
  const handleResetMap = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(defaultMapCenter, 13, { animate: true });
    }
    setSelectedReport(null);
  };

  // Focus a specific report on map
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    if (report && mapRef.current) {
      const coords = getReportCoords(report);
      mapRef.current.flyTo(coords, 15, { animate: true, duration: 0.8 });
    }
  };

  // Generate PDF Audit Export
  const handleGeneratePDFAudit = async () => {
    try {
      setPdfGenerating(true);
      setPdfSuccessMessage('');

      const targetReport = selectedReport || reports[0];
      if (targetReport?.id) {
        const blob = await generateReportPDF(targetReport.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Audit-Report-${targetReport.tracking_id || targetReport.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setPdfSuccessMessage('Dokumen PDF Audit Wilayah berhasil diunduh.');
          setTimeout(() => setPdfSuccessMessage(''), 4000);
          return;
        }
      }
    } catch (err) {
      console.warn('PDF export fallback simulated:', err);
      // Create a clean client-side audit document download
      const auditSummary = `
==================================================
           LAPORAN AUDIT PETA INFRASTRUKTUR
                   INFRACHECK ADMIN
==================================================
Waktu Audit    : ${new Date().toLocaleString('id-ID')}
Petugas Audit  : ${user?.name || 'Administrator'} (${user?.email || 'admin@infracheck.id'})
Total Titik    : ${filteredReports.length} Titik Infrastruktur
Filter Status  : ${selectedStatus.toUpperCase()}
Filter Kategori: ${selectedCategory.toUpperCase()}
--------------------------------------------------
DAFTAR SEBARAN TITIK:
${filteredReports.map((r, i) => `${i + 1}. [${r.status.toUpperCase()}] ${r.title} - ${r.location} (${r.category_name}) | Konfirmasi: ${r.confirmations}`).join('\n')}
==================================================
      `;
      const blob = new Blob([auditSummary], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Audit_Peta_Infrastruktur_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setPdfSuccessMessage('Ringkasan Audit Peta Infrastruktur berhasil diekspor.');
      setTimeout(() => setPdfSuccessMessage(''), 4000);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Get status marker styling
  const getMarkerColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'new' || s === 'baru') {
      return {
        bg: 'bg-[#CA0000]',
        ring: 'ring-red-500/40',
        border: 'border-red-400',
        glow: 'shadow-[0_0_15px_rgba(202,0,0,0.8)]',
        pulse: 'bg-red-500',
        hex: '#CA0000',
        label: 'New (Baru)'
      };
    }
    if (s === 'processing' || s === 'diproses' || s === 'in_progress') {
      return {
        bg: 'bg-[#CA7200]',
        ring: 'ring-amber-500/40',
        border: 'border-amber-400',
        glow: 'shadow-[0_0_15px_rgba(202,114,0,0.8)]',
        pulse: 'bg-amber-500',
        hex: '#CA7200',
        label: 'Processing'
      };
    }
    return {
      bg: 'bg-[#0D9900]',
      ring: 'ring-emerald-500/40',
      border: 'border-emerald-400',
      glow: 'shadow-[0_0_15px_rgba(13,153,0,0.8)]',
      pulse: 'bg-emerald-500',
      hex: '#0D9900',
      label: 'Done (Selesai)'
    };
  };

  const headerLeft = (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c5c5d4]">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="search-reports-map-input"
        type="text"
        placeholder="Search reports..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full bg-[#2e3239] border border-[#444652] text-sm text-slate-100 rounded-full pl-10 pr-4 py-2 placeholder:text-[#6b7280] focus:outline-none focus:border-[#5f7adb] focus:ring-1 focus:ring-[#5f7adb] transition-all"
      />
    </div>
  );

  const headerRight = (
    <button
      id="generate-pdf-audit-btn"
      type="button"
      onClick={handleGeneratePDFAudit}
      disabled={pdfGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide bg-[#5f7adb] hover:bg-[#4b66cb] text-white transition-colors disabled:opacity-50 shadow-sm"
    >
      {pdfGenerating ? (
        <Spinner size="sm" color="white" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span>Generate PDF Audit</span>
    </button>
  );

  return (
    <AdminLayout headerLeft={headerLeft} headerRight={headerRight} maxWidth="max-w-none">
      <div id="map-admin-page" className="space-y-6 pb-12">
        {/* Welcome Greeting Header */}
        <div id="welcome-header" className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e1e2e5]">
            Map Overview
          </h2>
        </div>
        {/* Success Alert Banner for PDF */}
        {pdfSuccessMessage && (
          <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pdfSuccessMessage}</span>
            </div>
            <button onClick={() => setPdfSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="bg-amber-950/60 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchMapData} className="text-amber-300 hover:text-white">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* MAIN INTERACTIVE MAP CONTAINER (penanda & peta - node 21 in Stitch design) */}
        <div
          id="main-interactive-map-wrapper"
          className={`relative rounded-2xl overflow-hidden border border-[#444652] bg-[#111416] transition-all duration-300 shadow-xl ${isFullscreenMap ? 'fixed inset-4 z-50 rounded-2xl h-[calc(100vh-2rem)]' : 'h-[540px] sm:h-[610px] w-full'
            }`}
        >
          {/* Map Viewer Canvas with Leaflet Integration */}
          <MapContainer
            center={defaultMapCenter}
            zoom={13}
            scrollWheelZoom={true}
            zoomControl={false}
            className="w-full h-full relative"
            style={{ width: '100%', height: '100%' }}
          >
            <LeafletAdminMapController selectedReport={selectedReport} mapInstanceRef={mapRef} />

            {/* Tile Layer (Satellite vs Street Mode) */}
            {mapType === 'satellite' ? (
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AERO, USGS, BioData, GIS, User Community"
                maxZoom={19}
              />
            ) : (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
            )}

            {/* Dynamic Report Leaflet Markers */}
            {filteredReports.map((report) => {
              const coords = getReportCoords(report);
              const isSelected = selectedReport?.id === report.id;
              const colorCfg = getMarkerColorConfig(report);

              return (
                <Marker
                  key={`admin-leaflet-pin-${report.id}`}
                  position={coords}
                  icon={createAdminPinIcon(report, isSelected)}
                  eventHandlers={{
                    click: () => handleSelectReport(report),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                    <div className="bg-[#191c1e] text-white text-xs px-2.5 py-1 rounded-lg font-semibold border border-[#444652] shadow-lg flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorCfg.dotClass}`} />
                      <span>{report.title}</span>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* POPUP / SUMMARY CARD ON MAP WHEN A REPORT IS SELECTED */}
          {selectedReport && (
            <div
              id="map-selected-report-popup"
              className="absolute top-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-80 bg-[#191c1e]/95 backdrop-blur-md border border-[#5f7adb]/70 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#444652]">
                <div>
                  <h4 className="text-sm font-bold text-[#e1e2e5] leading-snug">
                    {selectedReport.title}
                  </h4>
                  <p className="text-[11px] text-[#c5c5d4]">{selectedReport.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="text-[#c5c5d4] hover:text-white p-1 rounded-md hover:bg-[#2e3239]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#999999]">Jenis Masalah:</span>
                  <span className="font-medium text-[#e1e2e5]">
                    {selectedReport.category_name || selectedReport.category?.name || 'Infrastruktur'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#999999]">Status:</span>
                  <StatusBadge status={selectedReport.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#999999] pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#5f7adb]" />
                    {selectedReport.confirmations} Konfirmasi
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-[#5f7adb]" />
                    {selectedReport.photos_count} Foto
                  </span>
                </div>

                {selectedReport.description && (
                  <p className="text-[11px] text-[#c5c5d4] line-clamp-2 bg-[#2e3239]/60 p-2 rounded-lg border border-[#444652]/60">
                    {selectedReport.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3.5 pt-2.5 border-t border-[#444652] flex items-center gap-2">
                <Button
                  id="popup-view-detail-btn"
                  size="sm"
                  variant="primary"
                  className="flex-1 text-xs"
                  onClick={() => {
                    if (selectedReport?.id) {
                      navigate(`/admin/reports/${selectedReport.id}`);
                    } else {
                      navigate('/admin/reports');
                    }
                  }}
                >
                  <span>Lihat Detail</span>
                </Button>
              </div>
            </div>
          )}

          {/* MAP FLOATING CONTROLS (Top Right) */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-[#444652] rounded-xl overflow-hidden shadow-lg flex flex-col">
              <button
                type="button"
                onClick={handleZoomIn}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]"
                title="Perbesar Peta (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]"
                title="Perkecil Peta (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetMap}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] transition-colors"
                title="Pusatkan Ulang"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Map Layer Switcher & Fullscreen */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-[#444652] rounded-xl overflow-hidden shadow-lg flex flex-col">
              <button
                type="button"
                onClick={() => setMapType((prev) => (prev === 'satellite' ? 'vector' : 'satellite'))}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]"
                title="Ganti Mode Peta (Satelit / Vektor)"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenMap(!isFullscreenMap)}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] transition-colors"
                title={isFullscreenMap ? 'Tutup Peta Penuh' : 'Mode Layar Penuh'}
              >
                {isFullscreenMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MAP LEGEND BAR (penanda-25 in Stitch Design Specs) */}
          <div
            id="map-legend-bar"
            className="map-legend-pill absolute bottom-4 left-4 z-30 flex items-center gap-3.5 bg-[#1a1a1a]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#595959] shadow-lg text-xs font-medium"
          >
            <div className="flex items-center gap-1.5" title="Urgensi: High (Merah)">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-red-500/30" />
              <span className="text-[#c5c5d4]">High</span>
            </div>
            <div className="flex items-center gap-1.5" title="Urgensi: Medium (Oranye)">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ring-orange-500/30" />
              <span className="text-[#c5c5d4]">Medium</span>
            </div>
            <div className="flex items-center gap-1.5" title="Urgensi: Low (Kuning)">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] ring-2 ring-yellow-500/30" />
              <span className="text-[#c5c5d4]">Low</span>
            </div>
            <div className="flex items-center gap-1.5" title="Status: Di Tangani (Hijau)">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-emerald-500/30" />
              <span className="text-[#c5c5d4]">Di tangani</span>
            </div>
            <div className="hidden sm:block pl-2 border-l border-[#595959] text-[11px] text-[#6b7280]">
              {filteredReports.length} Titik Aktif
            </div>
          </div>
        </div>

        {/* LOADING SPINNER OVERLAY */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-[#191c1e] border border-[#444652] rounded-2xl">
            <Spinner size="lg" color="blue" />
            <p className="mt-3 text-sm text-[#c5c5d4]">Memetakan koordinat laporan infrastruktur...</p>
          </div>
        )}

        {/* REPORTS CARDS GRID SECTION (sumber-report-map-43 in Stitch design) */}
        {!loading && (
          <div id="reports-grid-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#e1e2e5]">
                Daftar Titik Laporan Terpetakan ({filteredReports.length})
              </h3>
              <span className="text-xs text-[#c5c5d4]">
                Klik kartu untuk memfokuskan lokasi pada peta
              </span>
            </div>

            {filteredReports.length === 0 ? (
              <EmptyState
                id="map-empty-reports"
                title="Tidak Ada Laporan yang Cocok"
                description="Coba ubah kata kunci pencarian atau sesuaikan filter status dan kategori."
                actionLabel="Reset Semua Filter"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedCategory('all');
                }}
                className="bg-[#191c1e] border-[#444652]"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {paginatedReports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  const colorConfig = getMarkerColor(report.status);

                  return (
                    <div
                      key={`card-${report.id}`}
                      id={`report-map-card-${report.id}`}
                      onClick={() => handleSelectReport(report)}
                      className={`relative bg-[#191C1E] border rounded-xl p-3.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${isSelected
                        ? 'border-[#5f7adb] ring-1 ring-[#5f7adb] bg-[#22272c]'
                        : 'border-[#444652] hover:border-[#5f7adb]/60'
                        }`}
                    >
                      {/* Top Header: Title & Status Indicator */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-[#e1e2e5] truncate" title={report.title}>
                          {report.title}
                        </h4>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${colorConfig.bg}`}
                          title={`Status: ${report.status}`}
                        />
                      </div>

                      {/* Issue Subtitle */}
                      <p className="text-[11px] text-[#c5c5d4] opacity-80 truncate mb-3">
                        {report.category_name || report.category?.name || 'Infrastruktur Rusak'}
                      </p>

                      {/* Counters Row (Group 4 in mockup specs) */}
                      <div className="flex items-center justify-between text-[10px] text-[#999999] pt-2 border-t border-[#444652]/60">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#5f7adb]" />
                          <span>{report.confirmations} Konfirmasi</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-[#5f7adb]" />
                          <span>{report.photos_count} Foto</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION BAR (pagination-44 in Stitch design specs) */}
            {filteredReports.length > 0 && (
              <div
                id="map-pagination-bar"
                className="bg-[#191c1e] border border-[#444652] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              >
                {/* Left Entries Counter Text (text-46) */}
                <span className="text-[#c6c5d0]">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} entries
                </span>

                {/* Right Pagination Buttons (container-47) */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#c6c5d0] hover:bg-[#2e3239] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-medium transition-all ${currentPage === pageNum
                        ? 'bg-[#354477] text-[#a4b3ed] font-bold shadow-xs'
                        : 'text-[#c6c5d0] hover:bg-[#2e3239]'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#c6c5d0] hover:bg-[#2e3239] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILED REPORT MODAL */}
      <Modal
        id="map-report-detail-modal"
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Laporan & Audit Infrastruktur"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              id="navigate-report-detail-btn"
              variant="primary"
              size="sm"
              onClick={() => {
                setDetailModalOpen(false);
                if (selectedReport?.id) {
                  navigate(`/admin/reports/${selectedReport.id}`);
                }
              }}
            >
              <span>Buka Halaman Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-slate-800 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Lokasi & Judul Laporan
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedReport.title}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{selectedReport.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Kategori:</span>
                <span className="font-semibold text-slate-800">
                  {selectedReport.category_name || selectedReport.category?.name || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status:</span>
                <StatusBadge status={selectedReport.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Koordinat:</span>
                <span className="font-mono text-slate-700">
                  {selectedReport.latitude || '-6.2383'}, {selectedReport.longitude || '106.9756'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Deskripsi Masalah
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedReport.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {selectedReport.confirmations} Warga Mengonfirmasi
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                {selectedReport.photos_count} Foto Terlampir
              </span>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default MapAdminPage;
