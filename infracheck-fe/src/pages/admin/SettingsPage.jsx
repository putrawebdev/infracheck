import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Shield,
  KeyRound,
  Eye,
  Check,
  X,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Droplets,
  Car,
  Lightbulb,
  Building2,
  HelpCircle,
  RotateCcw,
  Search,
  FileDown
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import ProfileForm from '../../components/admin/ProfileForm';
import CategoryTable from '../../components/admin/CategoryTable';
import CategoryFormModal from '../../components/admin/CategoryFormModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/categories';
import { getAllReports, generateReportPDF } from '../../api/reports';
import { getAdminProfile } from '../../api/admin';
import useAuth from '../../hooks/useAuth';

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();

  // Search state for header search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'categories' | 'profile'

  // Category state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'info'

  // Admin Profile display data
  const [adminData, setAdminData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Categories
  const fetchCategoryList = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories();
      const list = Array.isArray(data) ? data : data?.data || [];
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showToast('Gagal memuat daftar kategori', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch Admin Profile Info
  const fetchAdminInfo = async () => {
    try {
      const res = await getAdminProfile();
      const profile = res?.data || res?.user || res;
      if (profile?.name) {
        setAdminData({
          name: profile.name,
          email: profile.email || '',
        });
      }
    } catch (err) {
      console.warn('Fallback admin profile info:', err);
    }
  };

  useEffect(() => {
    fetchCategoryList();
    fetchAdminInfo();
  }, []);

  useEffect(() => {
    if (user) {
      setAdminData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Handle Category Create / Edit Submit
  const handleCategorySubmit = async (formData) => {
    try {
      setCategoryActionLoading(true);
      if (selectedCategory) {
        // Update existing
        await updateCategory(selectedCategory.id, formData);
        showToast(`Kategori "${formData.name}" berhasil diperbarui!`, 'success');
      } else {
        // Create new
        await createCategory(formData);
        showToast(`Kategori "${formData.name}" berhasil ditambahkan!`, 'success');
      }
      setCategoryModalOpen(false);
      setSelectedCategory(null);
      await fetchCategoryList();
    } catch (err) {
      console.error('Category action error:', err);
      showToast(err?.response?.data?.message || 'Gagal menyimpan kategori.', 'error');
    } finally {
      setCategoryActionLoading(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (cat, e) => {
    if (e) e.stopPropagation();
    try {
      const updatedStatus = !cat.is_active;
      await updateCategory(cat.id, { is_active: updatedStatus });
      setCategories((prev) =>
        prev.map((item) =>
          item.id === cat.id ? { ...item, is_active: updatedStatus } : item
        )
      );
      showToast(
        `Kategori "${cat.name}" sekarang ${updatedStatus ? 'AKTIF' : 'NONAKTIF'}.`,
        'success'
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('Gagal mengubah status kategori', 'error');
    }
  };

  // Handle Delete Confirmation
  const confirmDeleteCategory = (cat) => {
    if (cat.reports_count > 0) {
      showToast(
        `Kategori "${cat.name}" memiliki ${cat.reports_count} laporan aktif dan tidak dapat dihapus. Nonaktifkan kategori sebagai alternatif.`,
        'error'
      );
      return;
    }
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!categoryToDelete) return;
    try {
      setCategoryActionLoading(true);
      await deleteCategory(categoryToDelete.id);
      showToast(`Kategori "${categoryToDelete.name}" berhasil dihapus.`, 'success');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      await fetchCategoryList();
    } catch (err) {
      console.error('Delete category error:', err);
      showToast('Gagal menghapus kategori.', 'error');
    } finally {
      setCategoryActionLoading(false);
    }
  };

  // Helper for User Initials
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper for Category Icons
  const getCategoryIcon = (categoryName) => {
    const name = String(categoryName || '').toLowerCase();
    if (name.includes('jalan') || name.includes('road')) {
      return (
        <svg className="w-5 h-5 text-[#A3B3EF]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 16V0H2V16H0ZM7 16V12H9V16H7ZM14 16V0H16V16H14ZM7 10V6H9V10H7ZM7 4V0H9V4H7Z" fill="currentColor" />
        </svg>
      );
    }
    if (name.includes('jembatan') || name.includes('bridge')) {
      return <Car className="w-5 h-5 text-[#A3B3EF]" />;
    }
    if (name.includes('drainase') || name.includes('air') || name.includes('saluran')) {
      return <Droplets className="w-5 h-5 text-[#A3B3EF]" />;
    }
    if (name.includes('lampu') || name.includes('penerangan') || name.includes('listrik')) {
      return <Lightbulb className="w-5 h-5 text-[#c5c5d4]" />;
    }
    return <Tag className="w-5 h-5 text-[#A3B3EF]" />;
  };

  const handleGeneratePdf = async () => {
    try {
      setPdfLoading(true);
      showToast('Menyiapkan berkas audit PDF...', 'info');
      const reportsRes = await getAllReports({ per_page: 1 });
      const reportList = Array.isArray(reportsRes) ? reportsRes : reportsRes?.data || [];
      const targetId = reportList[0]?.id;

      if (!targetId) {
        showToast('Tidak ada laporan untuk di-generate audit PDF.', 'error');
        return;
      }

      const blob = await generateReportPDF(targetId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `InfraCheck_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Laporan audit PDF berhasil diunduh.', 'success');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Gagal men-generate laporan audit PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const headerLeft = (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c5c5d4]">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="settings-search-input"
        type="text"
        placeholder="Search settings..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-[#2e3239] border border-[#444652] text-sm text-slate-100 rounded-full pl-10 pr-4 py-2 placeholder:text-[#6b7280] focus:outline-none focus:border-[#5f7adb] focus:ring-1 focus:ring-[#5f7adb] transition-all"
      />
    </div>
  );

  const headerRight = (
    <button
      id="generate-pdf-btn-settings"
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
      <div id="settings-page-root" className="space-y-6 pb-16">
        {/* Welcome Greeting Header */}
        <div id="welcome-header" className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e1e2e5]">
            Settings & Profil
          </h2>
        </div>


        {/* Global Toast / Feedback Notification Banner (Ketentuan #5) */}
        {toastMessage && (
          <div
            id="settings-notification-toast"
            className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastType === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : toastType === 'error'
                ? 'bg-red-950/80 border-red-500/50 text-red-300'
                : 'bg-blue-950/80 border-blue-500/50 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {toastType === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : toastType === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB CONTENT 1: OVERVIEW (Matching exact Figma Specs & Settings.png layout) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* SECTION 1: KONFIGURASI KATEGORI CARD (Matching Figma layout) */}
            <div
              id="category-configuration-card"
              className="bg-[#191c1e] border border-[#444652] rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Card Header Bar */}
              <div className="p-5 sm:p-6 border-b border-[#444652] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#202a4d] border border-[#354477] flex items-center justify-center text-[#5f7adb]">
                    <svg className="w-5 h-5" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3.5 9L9 0L14.5 9H3.5ZM14.5 20C13.25 20 12.1875 19.5625 11.3125 18.6875C10.4375 17.8125 10 16.75 10 15.5C10 14.25 10.4375 13.1875 11.3125 12.3125C12.1875 11.4375 13.25 11 14.5 11C15.75 11 16.8125 11.4375 17.6875 12.3125C18.5625 13.1875 19 14.25 19 15.5C19 16.75 18.5625 17.8125 17.6875 18.6875C16.8125 19.5625 15.75 20 14.5 20ZM0 19.5V11.5H8V19.5H0ZM14.5 18C15.2 18 15.7917 17.7583 16.275 17.275C16.7583 16.7917 17 16.2 17 15.5C17 14.8 16.7583 14.2083 16.275 13.725C15.7917 13.2417 15.2 13 14.5 13C13.8 13 13.2083 13.2417 12.725 13.725C12.2417 14.2083 12 14.8 12 15.5C12 16.2 12.2417 16.7917 12.725 17.275C13.2083 17.7583 13.8 18 14.5 18ZM2 17.5H6V13.5H2V17.5ZM7.05 7H10.95L9 3.85L7.05 7Z"
                        fill="#5F7ADB"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#e1e2e5] tracking-tight">
                      Konfigurasi Kategori
                    </h3>
                    <p className="text-xs text-[#c5c5d4]">
                      Kelola kategori laporan infrastruktur publik dan status ketersediaannya
                    </p>
                  </div>
                </div>

                <button
                  id="add-category-overview-btn"
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#323537] hover:bg-[#3d4246] text-[#e1e2e5] hover:text-white rounded-full border border-[#444652] text-xs sm:text-sm font-semibold transition-all active:scale-98 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              {/* Category List Items (Matching Item 1, 2, 3, 4 from Figma Stitch export) */}
              <div className="divide-y divide-[#444652]/70">
                {loadingCategories ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <Spinner size="lg" color="blue" />
                    <p className="mt-3 text-xs text-[#c5c5d4]">Memuat konfigurasi kategori...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#c5c5d4]">
                    Belum ada kategori yang terdaftar.
                  </div>
                ) : (
                  categories.map((cat, index) => {
                    const isActive = cat.is_active !== false;
                    return (
                      <div
                        key={cat.id || index}
                        id={`category-item-${cat.id}`}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#22252a]/60 ${
                          !isActive ? 'opacity-65 bg-[#17191b]' : ''
                        }`}
                      >
                        {/* Left: Category Icon & Label */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                              isActive
                                ? 'bg-[#344479]/20 border-[#b5c4ff]/30 text-[#A3B3EF] shadow-xs'
                                : 'bg-[#323537]/50 border-[#444652] text-[#c5c5d4]'
                            }`}
                          >
                            {getCategoryIcon(cat.name)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-bold text-[#e1e2e5]">
                                {cat.name}
                              </h4>
                              {cat.reports_count !== undefined && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#202a4d] text-[#a4b3ed] border border-[#354477]">
                                  {cat.reports_count} Laporan
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#c5c5d4] mt-0.5">
                              {cat.description || `Kategori Infrastruktur #${index + 1}`}
                            </p>
                          </div>
                        </div>

                        {/* Right: Status Toggle Switch + Edit & Delete Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          {/* Active / Inactive Pill Toggle Switch */}
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[11px] font-bold tracking-wider uppercase ${
                                isActive ? 'text-[#c5c5d4]' : 'text-[#8b8b98]'
                              }`}
                            >
                              {isActive ? 'AKTIF' : 'NONAKTIF'}
                            </span>

                            <button
                              id={`toggle-category-${cat.id}`}
                              type="button"
                              onClick={(e) => handleToggleStatus(cat, e)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive
                                  ? 'bg-[#344479] border-[#344479]'
                                  : 'bg-[#323537] border-[#444652]'
                              }`}
                              role="switch"
                              aria-checked={isActive}
                              title={`Ubah status menjadi ${isActive ? 'Nonaktif' : 'Aktif'}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isActive
                                    ? 'translate-x-5 bg-[#a3b3ef]'
                                    : 'translate-x-0 bg-[#c5c5d4]'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              id={`edit-category-btn-${cat.id}`}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setCategoryModalOpen(true);
                              }}
                              className="p-2 text-[#c5c5d4] hover:text-white hover:bg-[#2e3239] rounded-lg transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              id={`delete-category-btn-${cat.id}`}
                              type="button"
                              onClick={() => confirmDeleteCategory(cat)}
                              className="p-2 text-[#c5c5d4] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Notice (Matching Figma Specs text-117) */}
              <div className="bg-[#111416]/50 border-t border-[#444652] p-4 flex items-center gap-2.5 text-xs text-[#c5c5d4]">
                <Info className="w-4 h-4 text-[#5f7adb] shrink-0" />
                <span>
                  Kategori yang sudah digunakan oleh laporan aktif tidak dapat dihapus, hanya dinonaktifkan.
                </span>
              </div>
            </div>

            {/* SECTION 2: PROFIL ADMIN CARD (Matching Figma layout profile-card-118) */}
            <div
              id="admin-profile-overview-card"
              className="bg-[#191c1e] border border-[#444652] rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden"
            >
              {/* Header Title */}
              <div className="flex items-center justify-between pb-4 border-b border-[#444652]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#202a4d] border border-[#354477] flex items-center justify-center text-[#5f7adb]">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#e1e2e5]">
                    Profil Admin
                  </h3>
                </div>

                <button
                  id="edit-profile-tab-switch-btn"
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#a4b3ed] hover:text-white font-medium bg-[#2e3239] px-3 py-1.5 rounded-full border border-[#444652] transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ubah Data & Password</span>
                </button>
              </div>

              {/* Content Box: Large Initials + Name & Email Pills */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Large Initials Box (Matching AS in Figma) */}
                <div
                  id="admin-avatar-initials"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#48484d] text-[#e1e2e5] flex items-center justify-center text-3xl sm:text-4xl font-bold tracking-tight shrink-0 shadow-md border border-[#444652]"
                >
                  {getInitials(adminData.name)}
                </div>

                {/* Name & Email Fields */}
                <div className="space-y-4 w-full max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-[#c5c5d4] mb-1.5">
                      Nama :
                    </label>
                    <div className="bg-[#141415] border border-[#444652]/80 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium text-[#e1e2e5] shadow-inner">
                      {adminData.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#c5c5d4] mb-1.5">
                      Email:
                    </label>
                    <div className="bg-[#141415] border border-[#444652]/80 rounded-full px-4 py-2.5 text-xs sm:text-sm font-mono text-[#e1e2e5] shadow-inner truncate">
                      {adminData.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: MANAJEMEN KATEGORI (Ketentuan #4: CategoryTable & CategoryFormModal) */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191c1e] border border-[#444652] p-5 rounded-2xl shadow-md">
              <div>
                <h3 className="text-base font-bold text-[#e1e2e5]">
                  Tabel Manajemen Kategori Infrastruktur
                </h3>
                <p className="text-xs text-[#c5c5d4]">
                  Kelola master data klasifikasi kerusakan, slug identifier, dan statistik laporan
                </p>
              </div>

              <button
                id="add-category-tab-btn"
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5f7adb] hover:bg-[#4b66cb] text-white text-xs sm:text-sm font-semibold rounded-full shadow-md transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori Baru</span>
              </button>
            </div>

            {/* Integrated CategoryTable Component */}
            <CategoryTable
              id="admin-settings-category-table"
              categories={categories}
              isLoading={loadingCategories}
              onEdit={(cat) => {
                setSelectedCategory(cat);
                setCategoryModalOpen(true);
              }}
              onDelete={confirmDeleteCategory}
            />
          </div>
        )}

        {/* TAB CONTENT 3: PROFIL ADMIN & KEAMANAN (Ketentuan #3: ProfileForm terhubung ke api/admin.js) */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-[#191c1e] border border-[#444652] p-5 rounded-2xl shadow-md">
              <h3 className="text-base font-bold text-[#e1e2e5]">
                Formulir Profil & Keamanan Akun
              </h3>
              <p className="text-xs text-[#c5c5d4]">
                Perbarui nama lengkap, kontak email resmi, serta kata sandi akun administrator Anda
              </p>
            </div>

            {/* Integrated ProfileForm Component */}
            <ProfileForm id="admin-settings-profile-form" />
          </div>
        )}

        {/* MODAL: CATEGORY FORM MODAL (Create & Edit) */}
        <CategoryFormModal
          id="settings-category-modal"
          isOpen={categoryModalOpen}
          onClose={() => {
            setCategoryModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleCategorySubmit}
          category={selectedCategory}
          isLoading={categoryActionLoading}
        />

        {/* MODAL: DELETE CATEGORY CONFIRMATION */}
        {deleteModalOpen && categoryToDelete && (
          <Modal
            id="delete-category-modal"
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            title="Konfirmasi Hapus Kategori"
            maxWidth="max-w-md"
            footer={
              <>
                <Button
                  id="cancel-delete-category-btn"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={categoryActionLoading}
                >
                  Batal
                </Button>
                <Button
                  id="confirm-delete-category-btn"
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteExecute}
                  isLoading={categoryActionLoading}
                >
                  Hapus Kategori
                </Button>
              </>
            }
          >
            <div className="space-y-3 text-sm text-[#c5c5d4]">
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Apakah Anda yakin ingin menghapus kategori{' '}
                  <strong className="font-bold text-white">{categoryToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </span>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
