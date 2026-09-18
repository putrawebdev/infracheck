import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import BottomNavDock from '../../components/public/BottomNavDock';
import { useLocationContext, BEKASI_DEFAULT_COORDS } from '../../context/LocationContext';
import { getCategories } from '../../api/categories';
import { createReport } from '../../api/reports';
import { compressImage } from '../../utils/imageCompressor';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary';
import MapPin from '@mui/icons-material/LocationOnOutlined';
import Layers from '@mui/icons-material/LayersOutlined';
import Check from '@mui/icons-material/Check';
import UploadCloud from '@mui/icons-material/CloudUploadOutlined';
import X from '@mui/icons-material/Close';
import Navigation from '@mui/icons-material/Navigation';
import Send from '@mui/icons-material/Send';
import Copy from '@mui/icons-material/ContentCopyOutlined';
import Camera from '@mui/icons-material/CameraAltOutlined';
import AlignLeft from '@mui/icons-material/Notes';
import ChevronDown from '@mui/icons-material/ExpandMore';

const NewReportPage = () => {
  const navigate = useNavigate();
  const { userLocation, hasUserLocation, refreshLocation } = useLocationContext();

  // New report form state
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    category_name: '',
    description: '',
    location: '',
    latitude: userLocation?.lat ?? BEKASI_DEFAULT_COORDS[0],
    longitude: userLocation?.lng ?? BEKASI_DEFAULT_COORDS[1],
    urgency: 'medium',
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Success modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedReportData, setSubmittedReportData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef(null);

  // Sync user location if available
  useEffect(() => {
    if (hasUserLocation && userLocation) {
      setFormData((prev) => {
        const isDefaultOrCoords =
          !prev.location ||
          prev.location.startsWith('Titik GPS (') ||
          prev.location.includes('Kota Bekasi, Jawa Barat (Default)');

        return {
          ...prev,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          location: isDefaultOrCoords
            ? `Titik GPS (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
            : prev.location,
        };
      });
    }
  }, [hasUserLocation, userLocation]);

  // Load categories
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        setIsLoadingCategories(true);
        const cats = await getCategories();
        if (!isMounted) return;
        const validList = Array.isArray(cats) ? cats.filter(c => c.is_active !== false) : [];
        setCategories(validList);
        if (validList.length > 0) {
          setFormData((prev) => {
            const hasMatch = validList.some((c) => String(c.id) === String(prev.category_id));
            const activeCat = hasMatch ? validList.find((c) => String(c.id) === String(prev.category_id)) : validList[0];
            return {
              ...prev,
              category_id: activeCat.id,
              category_name: activeCat.name,
            };
          });
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Image Upload Handlers with Client-Side Compression
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsCompressing(true);
      const compressionResults = await Promise.all(
        files.map((file) => compressImage(file, { maxWidth: 1600, quality: 0.82 }))
      );

      const compressedFiles = compressionResults.map((r) => r.file);
      const newPreviews = compressionResults.map((r) => r.previewUrl);

      setSelectedImages((prev) => [...prev, ...compressedFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.warn('Compression error, using original files:', err);
      setSelectedImages((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[indexToRemove]);
      return updated.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // GPS auto-locate using shared LocationContext refresh
  const handleDetectLocation = () => {
    setIsLocating(true);
    refreshLocation({
      silent: false,
      maxAge: 0,
      onSuccess: (coords) => {
        setFormData((prev) => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lng,
          location: `Titik GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        }));
        setIsLocating(false);
      },
      onError: (err) => {
        alert(typeof err === 'string' ? err : 'Gagal mendeteksi lokasi GPS. Menggunakan lokasi default Bekasi.');
        setFormData((prev) => ({
          ...prev,
          latitude: BEKASI_DEFAULT_COORDS[0],
          longitude: BEKASI_DEFAULT_COORDS[1],
          location: prev.location || 'Kota Bekasi, Jawa Barat (Default)',
        }));
        setIsLocating(false);
      },
    });
  };

  // Form Submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.description.trim()) {
      errors.description = 'Deskripsi masalah wajib diisi.';
    }
    if (!formData.location.trim()) {
      errors.location = 'Lokasi kerusakan wajib diisi.';
    }
    if (!formData.category_id && categories.length > 0) {
      errors.category_id = 'Pilih kategori kerusakan.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setUploadStatusText('');

    try {
      const selectedCat = categories.find((c) => String(c.id) === String(formData.category_id)) || categories[0];
      const categoryName = selectedCat?.name || formData.category_name || 'Jalan Berlubang';
      const categoryId = selectedCat?.id || formData.category_id || 1;

      const payload = new FormData();
      payload.append(
        'title',
        formData.title || (formData.location ? `Kerusakan di ${formData.location}` : 'Laporan Kerusakan')
      );
      payload.append('category', categoryName);
      payload.append('category_name', categoryName);
      payload.append('category_id', categoryId);
      payload.append('description', formData.description);
      payload.append('location', formData.location);
      payload.append('location_address', formData.location);
      payload.append('latitude', formData.latitude);
      payload.append('longitude', formData.longitude);
      payload.append('urgency', formData.urgency);
      payload.append('reporter_name', 'Warga');
      payload.append('reporter_phone', '');

      if (selectedImages.length > 0) {
        if (isCloudinaryConfigured()) {
          const uploadedUrls = [];
          for (let i = 0; i < selectedImages.length; i++) {
            setUploadStatusText(`Mengunggah foto bukti.....(${i + 1}/${selectedImages.length})...`);
            try {
              const res = await uploadToCloudinary(selectedImages[i], { folder: 'infracheck/reports' });
              uploadedUrls.push(res.url);
            } catch (cldErr) {
              console.warn(`Gagal upload foto ${i + 1} ke Cloudinary, menggunakan file langsung:`, cldErr);
              payload.append('images[]', selectedImages[i]);
            }
          }

          if (uploadedUrls.length > 0) {
            payload.append('photo_url', uploadedUrls[0]);
            uploadedUrls.forEach((u) => {
              payload.append('images[]', u);
            });
          }
        } else {
          // Fallback direct upload if Cloudinary is not configured in .env
          selectedImages.forEach((file) => {
            payload.append('images[]', file);
          });
        }
      }

      setUploadStatusText('Menyimpan laporan...');
      const created = await createReport(payload);
      setSubmittedReportData(created?.data || created);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('Gagal mengirim laporan. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  const handleCopyTrackingCode = () => {
    const code = submittedReportData?.tracking_id || '';
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <PublicLayout>
      <div
        id="new-report-page"
        className="h-full w-full bg-[#111416] text-slate-100 flex flex-col justify-between overflow-hidden relative select-none md:select-auto font-['Poppins',sans-serif]"
      >
        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 w-full max-w-xl mx-auto overflow-y-auto px-4 pb-28 pt-6 scrollbar-none">
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Title in Material 3 Headline Style */}
            <div className="px-1">
              <h1 className="text-2xl font-semibold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Buat Laporan
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-['Plus_Jakarta_Sans']">
                Sampaikan laporan kerusakan fasilitas publik di sekitar Anda.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* 1. Category Selection (Material 3 Filled Tonal Field) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 px-1 font-['Plus_Jakarta_Sans']">
                  <Layers className="w-4 h-4 text-[#8ca0eb]" />
                  <span>Kategori Infrastruktur</span>
                  <span className="text-rose-400">*</span>
                </label>

                <div className="relative bg-[#1a1e24] hover:bg-[#20252d] border border-[#2e3440] focus-within:border-[#5F7ADB] focus-within:ring-1 focus-within:ring-[#5F7ADB] rounded-2xl transition-all">
                  {isLoadingCategories ? (
                    <div className="py-3.5 px-4 flex items-center gap-2 text-xs text-slate-400">
                      <Spinner size="sm" />
                      <span>Memuat kategori...</span>
                    </div>
                  ) : (
                    <div className="relative flex items-center">
                      <select
                        value={formData.category_id}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const catObj = categories.find((c) => String(c.id) === String(selectedId));
                          setFormData((prev) => ({
                            ...prev,
                            category_id: selectedId,
                            category_name: catObj?.name || prev.category_name,
                          }));
                        }}
                        className="w-full bg-transparent text-sm text-slate-100 py-3.5 pl-4 pr-10 appearance-none focus:outline-none cursor-pointer font-medium"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-[#1c2026] text-white py-2">
                            {cat.name} {cat.code ? `(${cat.code})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
                    </div>
                  )}
                </div>
                {formErrors.category_id && (
                  <p className="text-xs text-rose-400 px-1 font-medium">{formErrors.category_id}</p>
                )}
              </div>

              {/* 2. Urgency Level (Material 3 Segmented Button / Tonal Filter Chips) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 px-1 font-['Plus_Jakarta_Sans']">
                  <span>Tingkat Urgensi</span>
                </label>

                <div className="grid grid-cols-3 gap-2 bg-[#1a1e24] p-1.5 rounded-2xl border border-[#2e3440]">
                  {[
                    {
                      key: 'low',
                      label: 'Rendah',
                      activeClass: 'bg-[#FFD700]/20 border border-[#FFD700]/60 text-[#FFD700] font-semibold shadow-xs',
                      checkClass: 'text-[#FFD700]',
                      hoverClass: 'hover:text-[#FFD700] hover:bg-[#FFD700]/10',
                    },
                    {
                      key: 'medium',
                      label: 'Sedang',
                      activeClass: 'bg-[#DB7538]/20 border border-[#DB7538]/60 text-[#DB7538] font-semibold shadow-xs',
                      checkClass: 'text-[#DB7538]',
                      hoverClass: 'hover:text-[#DB7538] hover:bg-[#DB7538]/10',
                    },
                    {
                      key: 'high',
                      label: 'Tinggi',
                      activeClass: 'bg-[#EE0000]/20 border border-[#EE0000]/60 text-[#EE0000] font-semibold shadow-xs',
                      checkClass: 'text-[#EE0000]',
                      hoverClass: 'hover:text-[#EE0000] hover:bg-[#EE0000]/10',
                    },
                  ].map((item) => {
                    const isSelected = formData.urgency === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, urgency: item.key }))}
                        className={`py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${isSelected
                          ? item.activeClass
                          : `border-transparent text-slate-400 font-medium ${item.hoverClass}`
                          }`}
                      >
                        {isSelected && <Check className={`w-3.5 h-3.5 stroke-[3] ${item.checkClass}`} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Description Field (Material 3 Outlined / Tonal Textarea) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 px-1 font-['Plus_Jakarta_Sans']">
                  <AlignLeft className="w-4 h-4 text-[#8ca0eb]" />
                  <span>Deskripsi Masalah</span>
                  <span className="text-rose-400">*</span>
                </label>

                <div className="bg-[#1a1e24] border border-[#2e3440] focus-within:border-[#5F7ADB] focus-within:ring-1 focus-within:ring-[#5F7ADB] rounded-2xl p-3 transition-all">
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ceritakan detail kerusakan yang terjadi di lapangan..."
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
                {formErrors.description && (
                  <p className="text-xs text-rose-400 px-1 font-medium">{formErrors.description}</p>
                )}
              </div>

              {/* 4. Photo Evidence (Material 3 Tonal Dropzone & Circular Action) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 font-['Plus_Jakarta_Sans']">
                    <Camera className="w-4 h-4 text-[#8ca0eb]" />
                    <span>Foto Bukti Kerusakan</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-['Plus_Jakarta_Sans']">Maks. 4 foto</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {/* Dropzone with M3 soft rounded style */}
                <div
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className={`bg-[#1a1e24] hover:bg-[#202630] border border-dashed border-[#343b49] hover:border-[#5F7ADB] rounded-2xl p-4 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-1.5 ${isCompressing ? 'opacity-70 pointer-events-none' : ''
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#262c37] group-hover:bg-[#354376] flex items-center justify-center text-slate-300 group-hover:text-blue-200 transition-colors">
                    {isCompressing ? (
                      <Spinner size="sm" color="blue" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-200">
                    {isCompressing ? 'Mengompresi foto untuk hemat kuota...' : 'Ketuk untuk mengunggah foto'}
                  </p>
                </div>

                {/* Previews Reel */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1.5 scrollbar-none">
                    {imagePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-[#343b49] group"
                      >
                        <img
                          src={previewUrl}
                          alt={`Bukti ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Location & GPS Detect (Material 3 Leading Icon Input with Embedded Action) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 px-1 font-['Plus_Jakarta_Sans']">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Lokasi Kerusakan</span>
                  <span className="text-rose-400">*</span>
                </label>

                <div className="flex items-center gap-2 bg-[#1a1e24] border border-[#2e3440] focus-within:border-[#5F7ADB] focus-within:ring-1 focus-within:ring-[#5F7ADB] rounded-2xl pl-3.5 pr-2 py-1.5 transition-all">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Nama jalan atau patokan lokasi..."
                    className="flex-1 min-w-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#262c37] hover:bg-[#354376] text-blue-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 select-none active:scale-95"
                    title="Gunakan lokasi saya saat ini"
                  >
                    {isLocating ? (
                      <Spinner size="sm" color="blue" />
                    ) : (
                      <Navigation sx={{ fontSize: 14 }} className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="leading-none">GPS</span>
                  </button>
                </div>
                {formErrors.location && (
                  <p className="text-xs text-rose-400 px-1 font-medium">{formErrors.location}</p>
                )}
              </div>

              {/* Material 3 Extended Full-Width Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-[#5F7ADB] hover:bg-[#4d69d4] active:scale-[0.99] text-white font-semibold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span>{uploadStatusText || 'Mengirim Laporan...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Laporan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* BOTTOM NAVIGATION DOCK */}
        <BottomNavDock />

        {/* SUCCESS MODAL POPUP (Material 3 Dialog Style) */}
        <Modal
          id="success-report-modal"
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="text-center space-y-4 py-1 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Animated Glow Success Icon */}
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Laporan Berhasil Terkirim
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Laporan Anda telah tercatat dan siap diverifikasi oleh tim penanganan.
              </p>
            </div>

            {/* Tracking ID Ticket Box (Material 3 Dark Tonal Container) */}
            <div className="bg-[#14171d] border border-[#2d3340] rounded-2xl p-4 space-y-2 relative overflow-hidden text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Kode Tiket / ID Laporan
                </span>
                {copiedCode && (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
                    Tersalin!
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#1c2028] border border-[#343b49] rounded-xl px-3.5 py-2.5">
                <span className="font-mono text-base sm:text-lg font-bold text-[#8ca0eb] tracking-wider select-all">
                  {submittedReportData?.tracking_id || 'IC-2026-00050'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTrackingCode}
                  className="p-1.5 rounded-lg bg-[#252c38] hover:bg-[#323a4a] active:bg-[#3d4658] text-slate-300 hover:text-white border border-[#3b4455] transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Salin Kode"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-normal">
                Gunakan kode ini di halaman <span className="text-slate-300 font-medium">Track</span> untuk memantau pengerjaan.
              </p>
            </div>

            {/* Modal Actions (~15% more compact) */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  const code = submittedReportData?.tracking_id || 'IC-2026-00050';
                  navigate(`/report/track?id=${code}`);
                }}
                className="w-full py-2.5 px-3 rounded-full bg-[#5F7ADB] hover:bg-[#4d69d4] active:bg-[#3d59c4] text-white font-semibold text-[11px] tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                Lacak Laporan
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate('/');
                }}
                className="w-full py-2.5 px-3 rounded-full bg-[#252a35] hover:bg-[#313745] active:bg-[#3c4455] text-slate-200 hover:text-white font-semibold text-[11px] tracking-wide border border-[#373e4e] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                Kembali ke Peta
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PublicLayout>
  );
};

export default NewReportPage;
