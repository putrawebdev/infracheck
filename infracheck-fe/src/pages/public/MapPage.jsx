import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Search from '@mui/icons-material/Search';
import LayersOutlined from '@mui/icons-material/LayersOutlined';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import Close from '@mui/icons-material/Close';
import Navigation from '@mui/icons-material/Navigation';
import Send from '@mui/icons-material/Send';
import Tune from '@mui/icons-material/Tune';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import ForestOutlined from '@mui/icons-material/ForestOutlined';
import PublicLayout from '../../components/layout/PublicLayout';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import DraggableBottomSheet from '../../components/public/DraggableBottomSheet';
import BottomNavDock from '../../components/public/BottomNavDock';
import LocationPermissionModal from '../../components/public/LocationPermissionModal';
import AddPhotoModal from '../../components/public/AddPhotoModal';
import { useLocationContext, BEKASI_DEFAULT_COORDS } from '../../context/LocationContext';
import { getAllReports, confirmReport, addReportPhoto } from '../../api/reports';
import { getCategories } from '../../api/categories';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary';
import CloudinaryImage from '../../components/ui/CloudinaryImage';
import {
  getReportHeadline,
  getMarkerColorConfig,
  getReportCoords,
} from '../../utils/reportHelpers';

const defaultCategoryList = [
  { id: 'all', name: 'Semua', icon: LayersOutlined },
  { id: 'Jalan Berlubang', name: 'Jalan Berlubang', icon: WarningAmberOutlined },
  { id: 'Jembatan Retak', name: 'Jembatan Retak', icon: ErrorOutlined },
  { id: 'Lampu Mati', name: 'Lampu Mati', icon: LightbulbOutlined },
  { id: 'Drainase', name: 'Drainase', icon: WaterDropOutlined },
  { id: 'Pohon Tumbang', name: 'Pohon Tumbang', icon: ForestOutlined },
];

// Default Location: Kota Bekasi (-6.2383, 106.9756)
const defaultMapCenter = BEKASI_DEFAULT_COORDS || [-6.2383, 106.9756];

const createPublicPinIcon = (report, isSelected) => {
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
    className: 'public-leaflet-marker',
    iconSize: [size, size * 1.33],
    iconAnchor: [size / 2, size * 1.33],
    popupAnchor: [0, -(size * 1.33)],
  });
};

const createUserLocationIcon = () => {
  const html = `
    <div class="user-location-marker">
      <div class="user-location-ring"></div>
      <div class="user-location-core"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-user-gps-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const LeafletMapController = ({ selectedReport, mapInstanceRef }) => {
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

const MapPage = () => {
  const navigate = useNavigate();

  // Geolocation & User Location Context
  const {
    userLocation,
    activeLocation,
    hasUserLocation,
    permissionStatus,
    requestLocation,
    useDefaultBekasi,
    openPrompt,
    isLocating,
  } = useLocationContext();

  // Core Data States
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Marker / Active Preview Report
  const [selectedReport, setSelectedReport] = useState(null);
  const [sheetState, setSheetState] = useState('peek'); // 'peek' | 'expanded'
  const [hoveredReport, setHoveredReport] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all | new | processing | done
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Map Navigation & Viewport States
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapType, setMapType] = useState('satellite'); // satellite | street
  const [isFullscreen, setIsFullscreen] = useState(false);

  // User Interactive Actions States
  const [confirmedReports, setConfirmedReports] = useState(() => {
    try {
      const saved = localStorage.getItem('infracheck_confirmed_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [confirmingId, setConfirmingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('home'); // home | track | about
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createReportModalOpen, setCreateReportModalOpen] = useState(false);
  const [newReportData, setNewReportData] = useState({
    title: '',
    location: '',
    category_id: 1,
    description: '',
    image_url: '',
    reporter_name: ''
  });

  const mapRef = useRef(null);

  // Handle fly to user location or request it
  const handleFlyToMyLocation = () => {
    if (hasUserLocation && userLocation) {
      if (mapRef.current) {
        mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 1 });
      }
      setToastMessage('Peta dipusatkan ke lokasi GPS Anda.');
      setTimeout(() => setToastMessage(''), 3000);
    } else {
      requestLocation(
        (coords) => {
          if (mapRef.current) {
            mapRef.current.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.2 });
          }
          setToastMessage('Lokasi Anda terdeteksi: Peta dipusatkan.');
          setTimeout(() => setToastMessage(''), 3500);
        },
        () => {
          if (mapRef.current) {
            mapRef.current.flyTo(defaultMapCenter, 13, { animate: true });
          }
          setToastMessage('Lokasi default: Kota Bekasi.');
          setTimeout(() => setToastMessage(''), 3500);
        }
      );
    }
  };

  // Fetch data on load
  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsData, categoriesData] = await Promise.allSettled([
        getAllReports(),
        getCategories(),
      ]);

      let loadedReports = [];
      if (reportsData.status === 'fulfilled' && reportsData.value) {
        const raw = Array.isArray(reportsData.value)
          ? reportsData.value
          : reportsData.value?.data || [];
        if (Array.isArray(raw)) {
          loadedReports = raw;
        }
      }

      setReports(loadedReports);

      if (loadedReports.length > 0 && !selectedReport) {
        setSelectedReport(loadedReports[0]);
      }

      if (categoriesData.status === 'fulfilled' && categoriesData.value) {
        const cats = Array.isArray(categoriesData.value)
          ? categoriesData.value
          : categoriesData.value?.data || [];
        setCategories(cats);
      }
    } catch (err) {
      console.warn('Error fetching reports:', err);
      setError('Gagal memuat titik peta laporan.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const titleMatch = String(report.title || '').toLowerCase().includes(search);
      const locMatch = String(report.location || '').toLowerCase().includes(search);
      const catMatch = String(report.category_name || report.category?.name || '').toLowerCase().includes(search);
      const descMatch = String(report.description || '').toLowerCase().includes(search);
      const passSearch = !search || titleMatch || locMatch || catMatch || descMatch;

      // Status
      const st = String(report.status || '').toLowerCase();
      let passStatus = true;
      if (selectedStatus === 'new') {
        passStatus = st === 'new' || st === 'baru';
      } else if (selectedStatus === 'processing') {
        passStatus = st === 'processing' || st === 'diproses' || st === 'in_progress' || st === 'sedang';
      } else if (selectedStatus === 'done') {
        passStatus = st === 'done' || st === 'selesai' || st === 'resolved';
      }

      // Category
      let passCategory = true;
      if (selectedCategory !== 'all') {
        const cName = String(report.category?.name || report.category_name || '').toLowerCase();
        passCategory = cName.includes(selectedCategory.toLowerCase()) || String(report.category_id) === String(selectedCategory);
      }

      return passSearch && passStatus && passCategory;
    });
  }, [reports, searchQuery, selectedStatus, selectedCategory]);

  // Active filter counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedStatus, searchQuery]);

  // Dynamic + standard category items with icons
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) {
      const list = [{ id: 'all', name: 'Semua', icon: LayersOutlined }];
      categories.forEach((cat) => {
        const name = typeof cat === 'string' ? cat : cat.name;
        if (!name) return;
        const lower = String(name).toLowerCase();
        let icon = WarningAmberOutlined;
        if (lower.includes('lampu') || lower.includes('penerangan') || lower.includes('listrik')) {
          icon = LightbulbOutlined;
        } else if (lower.includes('air') || lower.includes('drainase') || lower.includes('saluran') || lower.includes('banjir')) {
          icon = WaterDropOutlined;
        } else if (lower.includes('pohon') || lower.includes('taman') || lower.includes('lingkungan')) {
          icon = ForestOutlined;
        } else if (lower.includes('jembatan') || lower.includes('gedung') || lower.includes('bangunan') || lower.includes('retak')) {
          icon = ErrorOutlined;
        }
        list.push({
          id: name,
          name: name,
          icon,
        });
      });
      return list;
    }
    return defaultCategoryList;
  }, [categories]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };


  // Keep selected report updated if it matches filtered set
  useEffect(() => {
    if (selectedReport) {
      const refreshed = reports.find((r) => String(r.id) === String(selectedReport.id));
      if (refreshed) {
        setSelectedReport(refreshed);
      }
    }
  }, [reports]);

  // Map Controls (Leaflet API)
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
      mapRef.current.flyTo(activeLocation || defaultMapCenter, 13, { animate: true });
    }
    if (reports.length > 0) {
      setSelectedReport(reports[0]);
    }
  };

  // Marker Selection
  const handleSelectReport = (report) => {
    if (selectedReport?.id === report?.id) {
      setSheetState((prev) => (prev === 'peek' ? 'expanded' : 'peek'));
    } else {
      setSelectedReport(report);
      setSheetState('peek');
    }
  };

  // "Saya Juga Merasakan" Confirmation handler
  const handleConfirmReport = async (reportId) => {
    if (confirmedReports.includes(reportId)) {
      setToastMessage('Anda sudah mengonfirmasi laporan ini.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    try {
      setConfirmingId(reportId);
      const res = await confirmReport(reportId);

      const updatedConfirmed = [...confirmedReports, reportId];
      setConfirmedReports(updatedConfirmed);
      try {
        localStorage.setItem('infracheck_confirmed_reports', JSON.stringify(updatedConfirmed));
      } catch (e) {
        console.warn(e);
      }

      // Update local state count
      setReports((prev) =>
        prev.map((r) => {
          if (String(r.id) === String(reportId)) {
            return {
              ...r,
              confirmations: (r.confirmations || 0) + 1,
            };
          }
          return r;
        })
      );

      setToastMessage('Terima kasih! Dukungan Anda telah ditambahkan ke laporan.');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.warn(err);
    } finally {
      setConfirmingId(null);
    }
  };

  // Submit additional photo
  const handleAddPhotoSubmit = async ({ file, url, caption }) => {
    if ((!file && !url) || !selectedReport) return;

    try {
      setPhotoSubmitting(true);
      let payload;
      let previewUrl = url || '';

      if (file) {
        if (isCloudinaryConfigured()) {
          try {
            const cldRes = await uploadToCloudinary(file, { folder: 'infracheck/reports' });
            payload = {
              photo_url: cldRes.url,
              caption: caption || 'Bukti Tambahan Warga',
            };
            previewUrl = cldRes.url;
          } catch (cldErr) {
            console.warn('Cloudinary upload fallback to direct:', cldErr);
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('caption', caption || 'Bukti Tambahan Warga');
            payload = formData;
            previewUrl = URL.createObjectURL(file);
          }
        } else {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('caption', caption || 'Bukti Tambahan Warga');
          payload = formData;
          previewUrl = URL.createObjectURL(file);
        }
      } else {
        payload = {
          photo_url: url,
          caption: caption || 'Bukti Tambahan Warga',
        };
      }

      const res = await addReportPhoto(selectedReport.id, payload);
      const addedUrl = res?.photo_url || res?.data?.photo_url || previewUrl;

      // Update reports state
      setReports((prev) =>
        prev.map((r) => {
          if (String(r.id) === String(selectedReport.id)) {
            const curImages = Array.isArray(r.images) ? r.images : [];
            return {
              ...r,
              images: [addedUrl, ...curImages],
            };
          }
          return r;
        })
      );

      // Also update selectedReport state so DraggableBottomSheet immediately displays the new photo
      setSelectedReport((prev) => {
        if (!prev) return prev;
        const curImages = Array.isArray(prev.images) ? prev.images : [];
        return {
          ...prev,
          images: [addedUrl, ...curImages],
        };
      });

      setPhotoModalOpen(false);
      setToastMessage('Foto bukti berhasil ditambahkan ke laporan!');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.warn(err);
      setToastMessage('Gagal menambahkan foto bukti. Silakan coba lagi.');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Helper for urgency/status badge styling matching the mockup ("Sedang" warm pill)
  const renderStatusBadge = (report) => {
    const urgency = String(report.urgency || '').toLowerCase();
    const status = String(report.status || '').toLowerCase();

    if (report.status_label) {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#805816] text-[#ffcf70] border border-[#a1701e]/60 shadow-xs">
          {report.status_label}
        </span>
      );
    }

    if (urgency === 'high' || status === 'new' || status === 'baru') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#7f1d1d]/80 text-[#fca5a5] border border-red-500/40 shadow-xs">
          Baru
        </span>
      );
    }

    if (status === 'processing' || status === 'diproses' || urgency === 'medium') {
      return (
        <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#805816] text-[#ffcf70] border border-[#a1701e]/60 shadow-xs">
          Sedang
        </span>
      );
    }

    return (
      <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#064e3b]/80 text-[#6ee7b7] border border-emerald-500/40 shadow-xs">
        Selesai
      </span>
    );
  };

  return (
    <PublicLayout>
      <div id="warga-map-page" className="relative flex-1 flex flex-col w-full bg-[#111416] text-slate-100 overflow-hidden font-['Poppins',sans-serif]">

        {/* TOAST ALERT NOTIFICATION */}
        {toastMessage && (
          <div
            id="map-toast-notification"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e232a]/95 text-slate-100 border border-blue-500/50 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-md"
          >
            <CheckCircleOutlined className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TOP FLOATING SEARCH & FILTER BAR */}
        <div
          id="map-floating-header-bar"
          className="interactive-overlay-element absolute top-3 inset-x-3 sm:inset-x-6 z-30 flex flex-col gap-2 max-w-4xl mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-2">
            {/* Search Bar Input */}
            <div className="relative flex-1 bg-[#191c1e]/90 backdrop-blur-md border border-[#444652]/80 hover:border-[#5f7adb] focus-within:border-blue-500 rounded-full shadow-xl transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="public-map-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi, jalan, atau kerusakan..."
                className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none rounded-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  <Close className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop CTA "+ Laporkan" */}
            <button
              id="desktop-cta-laporkan-btn"
              type="button"
              onClick={() => setCreateReportModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Add className="w-4 h-4" />
              <span>Laporkan Kerusakan</span>
            </button>
          </div>

          {/* Quick Horizontal Scrollable Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 -mx-1 select-none">
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComp = cat.icon || LayersOutlined;
              return (
                <button
                  key={`quick-cat-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-150 shrink-0 ${isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/30 font-semibold'
                    : 'bg-[#191c1e]/90 text-slate-300 border border-[#444652]/70 hover:border-slate-400 hover:text-white hover:bg-[#23272e] active:scale-95'
                    }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPREHENSIVE FILTER MODAL / BOTTOM SHEET (MOBILE & DESKTOP REFINED) */}
        {showFilterDropdown && (
          <div
            id="map-filter-overlay"
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFilterDropdown(false);
              }
            }}
          >
            <div
              id="map-filter-chips-panel"
              className="w-full sm:max-w-lg bg-[#191c1e] border-t sm:border border-[#3d424e] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 text-slate-100"
            >
              {/* Sheet Handle for Mobile */}
              <div className="w-12 h-1 rounded-full bg-slate-600/60 mx-auto sm:hidden -mt-1 mb-2" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#383c48]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Tune className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Filter Laporan Peta
                      {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                          {activeFilterCount} Aktif
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Saring laporan berdasarkan kategori dan status penanganan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(false)}
                  className="w-8 h-8 rounded-full bg-[#252932] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Tutup Filter"
                >
                  <Close className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filter Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Kategori Infrastruktur:
                  </span>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Reset Kategori
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categoryList.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const IconComp = cat.icon || LayersOutlined;
                    return (
                      <button
                        key={`modal-cat-${cat.id}`}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 text-left border ${isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md font-semibold ring-1 ring-white/20'
                          : 'bg-[#22262e] text-slate-300 border-[#383c48] hover:bg-[#2c313c] hover:border-slate-500'
                          }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter Section */}
              <div className="pt-2 border-t border-[#383c48]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Status Penanganan:
                  </span>
                  {selectedStatus !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('all')}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Reset Status
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'all', label: 'Semua Status', dotColor: 'bg-slate-400' },
                    { key: 'new', label: 'Baru', dotColor: 'bg-yellow-400' },
                    { key: 'processing', label: 'Diproses', dotColor: 'bg-blue-400' },
                    { key: 'done', label: 'Selesai', dotColor: 'bg-emerald-400' },
                  ].map((st) => {
                    const isSelected = selectedStatus === st.key;
                    return (
                      <button
                        key={`modal-st-${st.key}`}
                        type="button"
                        onClick={() => setSelectedStatus(st.key)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 border ${isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md font-semibold ring-1 ring-white/20'
                          : 'bg-[#22262e] text-slate-300 border-[#383c48] hover:bg-[#2c313c] hover:border-slate-500'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dotColor}`} />
                        <span className="truncate">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Match Count Summary */}
              <div className="px-3.5 py-2.5 rounded-xl bg-[#111416]/80 border border-[#2a2f38] flex items-center justify-between text-xs text-slate-400">
                <span>Menampilkan hasil:</span>
                <span className="font-semibold text-white">
                  {filteredReports.length} dari {reports.length} laporan
                </span>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-[#383c48] flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={activeFilterCount === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#3d4352] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#23272e] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  <RestartAlt className="w-3.5 h-3.5" />
                  <span>Reset Semua</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan ({filteredReports.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {/* MAIN INTERACTIVE LEAFLET MAP CONTAINER */}
        <div
          id="interactive-map-stage"
          className={`relative flex-1 w-full overflow-hidden select-none ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'min-h-[380px] sm:min-h-[460px]'
            }`}
        >
          <MapContainer
            center={defaultMapCenter}
            zoom={13}
            scrollWheelZoom={true}
            zoomControl={false}
            className="w-full h-full relative"
            style={{ width: '100%', height: '100%' }}
          >
            <LeafletMapController selectedReport={selectedReport} mapInstanceRef={mapRef} />

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
                  key={`leaflet-pin-${report.id}`}
                  position={coords}
                  icon={createPublicPinIcon(report, isSelected)}
                  eventHandlers={{
                    click: () => handleSelectReport(report),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                    <div className="bg-[#191c1e] text-white text-xs px-2.5 py-1 rounded-lg font-semibold border border-[#444652] shadow-lg flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorCfg.dotClass}`} />
                      <span>{getReportHeadline(report)}</span>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

            {/* User GPS Location Marker (When user grants/allows location) */}
            {hasUserLocation && userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserLocationIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="p-1 text-xs text-slate-100 font-['Poppins',sans-serif]">
                    <p className="font-bold text-blue-400 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Titik Lokasi Anda
                    </p>
                    <p className="text-slate-300 text-[11px] mt-0.5 font-mono">
                      {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>



          {/* MAP FLOATING CONTROLS (Right Side) */}
          <div className="interactive-overlay-element absolute top-28 sm:top-20 right-3 sm:right-6 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-[#181b1f]/90 backdrop-blur-md border border-[#444652] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* My Location / GPS Button */}
              <button
                id="map-my-location-btn"
                type="button"
                onClick={handleFlyToMyLocation}
                disabled={isLocating}
                className={`map-control-btn w-9 h-9 flex items-center justify-center transition-colors border-b border-[#444652]/70 cursor-pointer ${hasUserLocation
                  ? 'text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-[#2e3239]'
                  }`}
                title={hasUserLocation ? 'Pusatkan ke Lokasi Saya (Aktif)' : 'Deteksi Lokasi Saya (GPS)'}
              >
                {isLocating ? (
                  <Spinner size="sm" color="blue" />
                ) : (
                  <Navigation className={`w-4 h-4 ${hasUserLocation ? 'text-blue-400' : ''}`} />
                )}
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]/70"
                title="Perbesar Peta (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]/70"
                title="Perkecil Peta (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetMap}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#2e3239] transition-colors"
                title="Pusatkan Ulang Lokasi"
              >
                <RestartAlt className="w-4 h-4" />
              </button>
            </div>

            {/* Map Layer Switcher & Fullscreen */}
            <div className="bg-[#181b1f]/90 backdrop-blur-md border border-[#444652] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <button
                type="button"
                onClick={() => setMapType((prev) => (prev === 'satellite' ? 'street' : 'satellite'))}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#2e3239] transition-colors border-b border-[#444652]/70"
                title="Ganti Jenis Peta (Satelit / Jalan)"
              >
                <LayersOutlined className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="map-control-btn w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#2e3239] transition-colors"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              >
                {isFullscreen ? <FullscreenExit className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* FLOATING ACTION BUTTON "+" ON MAP AS SHOWN IN HOME.PNG (ONLY WHEN NO REPORT SELECTED) */}
          {!selectedReport && (
            <div className="interactive-overlay-element absolute bottom-20 right-4 sm:right-6 z-30 pointer-events-auto">
              <button
                id="floating-plus-create-report-btn"
                type="button"
                onClick={() => navigate('/report/new')}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#5f7adb] hover:bg-[#4d69d4] active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(95,122,219,0.55)] border border-white/20 transition-all duration-200 group cursor-pointer"
                title="Laporkan Kerusakan Baru"
              >
                <Add className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          )}
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="absolute inset-0 z-40 bg-[#111416]/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" color="blue" />
            <p className="text-sm font-medium text-slate-300">Memuat sebaran titik infrastruktur...</p>
          </div>
        )}

        {/* ERROR RESILIENCE BANNER */}
        {error && (
          <div className="px-4 py-2 bg-amber-950/60 border-y border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ErrorOutlined className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchMapData}
              className="text-white bg-amber-800/60 px-2.5 py-1 rounded text-[11px] hover:bg-amber-700"
            >
              Muat Ulang
            </button>
          </div>
        )}

        {/* INTERACTIVE DRAGGABLE BOTTOM SHEET (GOOGLE MAPS NATIVE STYLE) */}
        <AnimatePresence>
          {selectedReport && (
            <DraggableBottomSheet
              id="map-report-bottom-sheet"
              report={selectedReport}
              isOpen={Boolean(selectedReport)}
              sheetState={sheetState}
              onStateChange={(newState) => setSheetState(newState)}
              onClose={() => {
                setSelectedReport(null);
                setSheetState('closed');
              }}
              onConfirmReport={handleConfirmReport}
              isConfirmed={confirmedReports.includes(selectedReport.id)}
              isConfirming={confirmingId === selectedReport.id}
              onAddPhotoClick={() => setPhotoModalOpen(true)}
              onOpenLightbox={(imgUrl) => setActiveLightboxImg(imgUrl)}
              onOpenAuditDetail={() => setDetailModalOpen(true)}
              onResetMap={handleResetMap}
              onSearchFocus={() => {
                const searchInput = document.getElementById('public-map-search-input');
                if (searchInput) searchInput.focus();
              }}
              activeBottomTab={activeBottomTab}
              onTabChange={(tab) => {
                setActiveBottomTab(tab);
                if (tab === 'track') {
                  navigate('/report/track');
                } else if (tab === 'about') {
                  navigate('/about');
                }
              }}
              onCreateReportClick={() => navigate('/report/new')}
            />
          )}
        </AnimatePresence>

        {/* PERSISTENT BOTTOM NAVIGATION DOCK (FIXED AT BOTTOM FOR MOBILE CONSISTENCY) */}
        <BottomNavDock
          id="map-persistent-bottom-dock"
          activeTab={activeBottomTab}
          onTabChange={(tab) => {
            setActiveBottomTab(tab);
            if (tab === 'track') {
              navigate('/report/track');
            } else if (tab === 'about') {
              navigate('/about');
            }
          }}
          onHomeClick={() => {
            setActiveBottomTab('home');
            handleResetMap();
            if (selectedReport) {
              setSelectedReport(null);
              setSheetState('closed');
            }
          }}
          onTrackClick={() => {
            setActiveBottomTab('track');
            navigate('/report/track');
          }}
          onAboutClick={() => {
            setActiveBottomTab('about');
            navigate('/about');
          }}
        />

      </div>

      {/* REFINED MATERIAL YOU MODAL / BOTTOM SHEET: TAMBAH FOTO BUKTI */}
      <AddPhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        report={selectedReport}
        onSubmit={handleAddPhotoSubmit}
        isSubmitting={photoSubmitting}
      />

      {/* MODAL: DETAIL LENGKAP AUDIT LAPORAN */}
      <Modal
        id="detail-audit-modal"
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Informasi & Riwayat Audit Infrastruktur"
        maxWidth="max-w-lg"
      >
        {selectedReport && (
          <div className="space-y-4 text-slate-800 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Tracking ID: {selectedReport.tracking_id || 'IC-2026-00049'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {getReportHeadline(selectedReport)}
              </h3>
              <p className="text-slate-600">{selectedReport.location || selectedReport.location_address || 'Kota Bekasi'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-0.5">Kategori:</span>
                <span className="font-semibold text-slate-800">
                  {selectedReport.category_name || selectedReport.category?.name || 'Jalan'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status Penanganan:</span>
                <StatusBadge status={selectedReport.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Dukungan Komunitas:</span>
                <span className="font-semibold text-blue-700">
                  {selectedReport.confirmations ?? selectedReport.confirmation_count ?? 1} Warga Mengonfirmasi
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Tingkat Urgensi:</span>
                <span className="font-semibold text-amber-700 capitalize">
                  {selectedReport.urgency || 'Sedang'}
                </span>
              </div>
            </div>

            {selectedReport.audit_meta && (
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/60 space-y-1">
                <span className="font-bold text-blue-900 block text-xs">Catatan Tim Lapangan PUPR:</span>
                <p className="text-slate-700">
                  <span className="font-semibold">Rekomendasi Tindakan:</span>{' '}
                  {selectedReport.audit_meta.recommended_action}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Indeks Keparahan:</span>{' '}
                  {selectedReport.audit_meta.severity_index}
                </p>
              </div>
            )}

            {selectedReport.timeline && selectedReport.timeline.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block">Riwayat Laporan:</span>
                <div className="space-y-2">
                  {selectedReport.timeline.map((step) => (
                    <div key={step.id} className="flex items-start gap-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">{step.title}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({step.timestamp})</span>
                        <p className="text-slate-600 text-[11px]">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: BUAT LAPORAN KERUSAKAN BARU */}
      <Modal
        id="buat-laporan-modal"
        isOpen={createReportModalOpen}
        onClose={() => setCreateReportModalOpen(false)}
        title="Laporkan Kerusakan Infrastruktur Baru"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newReportData.title.trim() || !newReportData.location.trim()) return;

            const selectedCat = categories.find((c) => String(c.id) === String(newReportData.category_id)) || { name: 'Jalan Berlubang' };
            const createdReport = {
              id: Date.now(),
              tracking_id: `IC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              title: newReportData.title.trim(),
              location: newReportData.location.trim(),
              category_id: newReportData.category_id,
              category_name: selectedCat.name || 'Jalan Berlubang',
              category: { name: selectedCat.name || 'Jalan Berlubang' },
              urgency: 'medium',
              status: 'new',
              status_label: 'Baru',
              confirmations: 1,
              reporter_name: newReportData.reporter_name.trim() || 'Warga Pelapor',
              description: newReportData.description.trim() || 'Laporan kerusakan baru dari warga.',
              images: [
                newReportData.image_url.trim() || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80'
              ],
              map_x: 45 + Math.floor(Math.random() * 20),
              map_y: 40 + Math.floor(Math.random() * 20),
              created_at: new Date().toISOString(),
              timeline: [
                {
                  id: 1,
                  status: 'new',
                  title: 'Laporan Diterima',
                  description: 'Laporan berhasil diunggah oleh warga dan masuk ke antrean verifikasi.',
                  timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                  actor: newReportData.reporter_name.trim() || 'Warga Pelapor'
                }
              ]
            };

            setReports([createdReport, ...reports]);
            setSelectedReport(createdReport);
            setCreateReportModalOpen(false);
            setNewReportData({
              title: '',
              location: '',
              category_id: 1,
              description: '',
              image_url: '',
              reporter_name: ''
            });

            setToastMessage('Laporan berhasil dibuat dan ditandai di peta!');
            setTimeout(() => setToastMessage(''), 3500);
          }}
          className="space-y-3.5 text-slate-800 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Laporan / Nama Ruas Jalan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newReportData.title}
              onChange={(e) => setNewReportData({ ...newReportData, title: e.target.value })}
              placeholder="Contoh: Jl. Ahmad Yani Km 2"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detail Alamat / Titik Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newReportData.location}
              onChange={(e) => setNewReportData({ ...newReportData, location: e.target.value })}
              placeholder="Contoh: Depan Kantor Pos Sirimau, Ambon"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Kerusakan
              </label>
              <select
                value={newReportData.category_id}
                onChange={(e) => setNewReportData({ ...newReportData, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={1}>Jalan Berlubang</option>
                <option value={2}>Jembatan Retak</option>
                <option value={3}>Lampu Mati</option>
                <option value={4}>Drainase / Saluran</option>
                <option value={5}>Pohon Tumbang</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Anda / Pelapor
              </label>
              <input
                type="text"
                value={newReportData.reporter_name}
                onChange={(e) => setNewReportData({ ...newReportData, reporter_name: e.target.value })}
                placeholder="Nama Anda"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              URL Foto Kerusakan
            </label>
            <input
              type="url"
              value={newReportData.image_url}
              onChange={(e) => setNewReportData({ ...newReportData, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/... (opsional)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Kerusakan & Dampak
            </label>
            <textarea
              rows={3}
              value={newReportData.description}
              onChange={(e) => setNewReportData({ ...newReportData, description: e.target.value })}
              placeholder="Jelaskan kondisi fisik kerusakan, perkiraan kedalaman lubang, atau dampaknya terhadap warga..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreateReportModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Kirim Laporan</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {activeLightboxImg && (
        <div
          id="image-lightbox-overlay"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <Close className="w-6 h-6" />
          </button>
          <CloudinaryImage
            src={activeLightboxImg}
            alt="Preview Foto Kerusakan"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* LOCATION PERMISSION POPUP MODAL ("ALLOW LOCATION FOR REPORTING") */}
      <LocationPermissionModal
        onLocationGranted={(coords) => {
          if (mapRef.current) {
            mapRef.current.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.2 });
          }
          setToastMessage('Akses lokasi diizinkan: Peta dipusatkan ke posisi Anda.');
          setTimeout(() => setToastMessage(''), 3500);
        }}
        onLocationDenied={() => {
          if (mapRef.current) {
            mapRef.current.flyTo(defaultMapCenter, 13, { animate: true, duration: 1 });
          }
          setToastMessage('Menampilkan lokasi default di Kota Bekasi.');
          setTimeout(() => setToastMessage(''), 3500);
        }}
      />
    </PublicLayout>
  );
};

export default MapPage;
