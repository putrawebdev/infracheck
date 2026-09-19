import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  Save,
  Check,
  ChevronRight,
} from 'lucide-react';
import { updateReportStatus } from '../../api/reports';
import Spinner from '../ui/Spinner';

const StatusUpdater = ({
  id = 'status-updater',
  reportId,
  currentStatus = 'new',
  onStatusUpdated,
  className = '',
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Sync state when currentStatus prop changes
  useEffect(() => {
    if (currentStatus) {
      setSelectedStatus(currentStatus);
    }
  }, [currentStatus]);

  const statusOptions = [
    {
      value: 'new',
      label: 'Baru',
      badgeLabel: 'New',
      desc: 'Laporan baru diterima & menunggu verifikasi',
      icon: Sparkles,
      activeColor: 'bg-[#202a4d] border-[#5f7adb] text-[#dce1ff] ring-1 ring-[#5f7adb]/40 shadow-sm shadow-[#5f7adb]/10',
      activeBadge: 'bg-[#5f7adb] text-white',
      accentDot: 'bg-[#5f7adb]',
    },
    {
      value: 'processing',
      label: 'Diproses',
      badgeLabel: 'Processing',
      desc: 'Divalidasi & unit lapangan dikerahkan',
      icon: Clock,
      activeColor: 'bg-[#472a00] border-[#ffb95a] text-[#ffdcb0] ring-1 ring-[#ffb95a]/40 shadow-sm shadow-[#ffb95a]/10',
      activeBadge: 'bg-[#ffb95a] text-[#744900]',
      accentDot: 'bg-[#ffb95a]',
    },
    {
      value: 'done',
      label: 'Selesai',
      badgeLabel: 'Done',
      desc: 'Perbaikan selesai & diverifikasi resmi',
      icon: CheckCircle2,
      activeColor: 'bg-[#00391c] border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40 shadow-sm shadow-emerald-500/10',
      activeBadge: 'bg-emerald-500 text-white',
      accentDot: 'bg-emerald-400',
    },
    {
      value: 'rejected',
      label: 'Ditolak',
      badgeLabel: 'Rejected',
      desc: 'Laporan tidak valid atau duplikasi data',
      icon: AlertTriangle,
      activeColor: 'bg-[#410002] border-red-500 text-red-200 ring-1 ring-red-500/40 shadow-sm shadow-red-500/10',
      activeBadge: 'bg-red-600 text-white',
      accentDot: 'bg-red-400',
    },
  ];

  const quickNotes = [
    'Tim teknis dikerahkan ke lokasi untuk inspeksi awal.',
    'Verifikasi fisik kerusakan telah dilakukan.',
    'Pekerjaan perbaikan infrastruktur telah selesai.',
    'Laporan tidak memenuhi kriteria verifikasi fisik.',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportId) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const payload = {
        status: selectedStatus,
        note: adminNote.trim() || undefined,
      };

      const res = await updateReportStatus(reportId, payload);
      setSuccess(true);
      if (onStatusUpdated) {
        const returnedStatus = res?.data?.status || res?.status || selectedStatus;
        onStatusUpdated({
          status: returnedStatus,
          note: adminNote.trim(),
          ...(res?.data || {}),
        });
      }
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err?.response?.data?.message || 'Gagal memperbarui status laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentOption = statusOptions.find((opt) => opt.value === selectedStatus);
  const currentLabel = currentOption ? currentOption.label : selectedStatus;

  return (
    <div id={id} className={`flex flex-col justify-between ${className}`}>
      <div className="space-y-4">
        {/* Error Notification Alert */}
        {error && (
          <div className="p-3 bg-[#410002]/90 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Success Notification Alert */}
        {success && (
          <div className="p-3 bg-[#00391c]/90 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 font-medium">
              Status audit berhasil diperbarui menjadi &quot;{currentLabel}&quot;!
            </span>
          </div>
        )}

        <form id={`${id}-form`} onSubmit={handleSubmit} className="space-y-4">
          {/* Status Segmented Selection Grid */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#c5c5d4] mb-2.5">
              <span>Status Audit</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {statusOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedStatus(opt.value)}
                    disabled={isLoading}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? opt.activeColor
                        : 'bg-[#252a35]/60 border-[#444652]/70 text-[#c5c5d4] hover:bg-[#252a35] hover:border-[#8ca0eb]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'scale-110' : 'opacity-70'}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                    <span className="text-[11px] opacity-75 line-clamp-1 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Note / Log Textarea Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`${id}-note`}
                className="text-xs font-semibold tracking-wide text-[#c5c5d4]"
              >
                <span>Catatan Tindak Lanjut</span>
              </label>
              <span className="text-[10px] text-[#8b8b98]">Opsional</span>
            </div>

            <textarea
              id={`${id}-note`}
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Tuliskan keterangan perbaikan, unit yang dikerahkan, atau alasan penolakan..."
              disabled={isLoading}
              className="w-full rounded-2xl border border-[#444652] bg-[#252a35] px-3.5 py-2.5 text-xs text-[#e4e1e6] placeholder:text-[#6b7280] focus:border-[#8ca0eb] focus:outline-none focus:ring-2 focus:ring-[#8ca0eb]/20 disabled:bg-[#1f2228] transition-all resize-none"
            />

            {/* Quick Note Suggestions / Presets */}
            <div className="mt-2.5 space-y-1.5">
              <span className="text-[11px] font-medium text-[#8b8b98] block">Template Catatan Cepat:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {quickNotes.map((preset, idx) => (
                  <button
                    key={`preset-${idx}`}
                    type="button"
                    onClick={() => setAdminNote(preset)}
                    className="px-2.5 py-1 bg-[#252a35] hover:bg-[#343844] border border-[#444652] text-[#dce1ff] text-[10px] rounded-full transition-colors cursor-pointer text-left truncate max-w-full"
                    title={preset}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              id={`${id}-submit-btn`}
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide bg-[#8ca0eb] hover:bg-[#a3b5fa] text-[#002b75] shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" color="blue" />
                  <span>Menyimpan Status...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdater;
