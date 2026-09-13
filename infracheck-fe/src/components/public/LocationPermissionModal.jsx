import React from 'react';
import { MapPin, Navigation, AlertCircle, X } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { useLocationContext } from '../../context/LocationContext';

const LocationPermissionModal = ({ onLocationGranted, onLocationDenied }) => {
  const {
    isPromptOpen,
    isLocating,
    locationError,
    requestLocation,
    useDefaultBekasi,
    closePrompt,
  } = useLocationContext();

  if (!isPromptOpen) return null;

  const handleAllow = () => {
    requestLocation(
      (coords) => {
        onLocationGranted && onLocationGranted(coords);
      },
      (err) => {
        onLocationDenied && onLocationDenied(err);
      }
    );
  };

  const handleDefault = () => {
    useDefaultBekasi();
    onLocationDenied && onLocationDenied('Default Bekasi dipilih.');
  };

  return (
    <div
      id="location-permission-modal-overlay"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="location-permission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-dialog-title"
        className="w-full max-w-[440px] bg-[#1e2229] border border-[#444652] rounded-[28px] p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-150 text-[#e1e2e5] font-['Poppins',sans-serif]"
      >
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={handleDefault}
          className="absolute top-4 right-4 w-9 h-9 rounded-full text-[#c5c5d4] hover:text-white hover:bg-[#2c313c] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Tutup dan gunakan lokasi default"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Material You (M3) Icon Slot */}
        <div className="flex items-center justify-start mb-4">
          <div className="w-12 h-12 rounded-full bg-[#354376] text-[#b8c8ff] flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        {/* M3 Headline & Body Text */}
        <div className="space-y-2">
          <h2
            id="location-dialog-title"
            className="text-xl font-semibold text-[#e1e2e5] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]"
          >
            Allow Location for Reporting
          </h2>
          <p className="text-xs sm:text-sm text-[#c5c5d4] leading-relaxed">
            Izinkan InfraCheck mengakses lokasi perangkat Anda untuk memetakan laporan infrastruktur secara akurat di area sekitar Anda.
          </p>
        </div>

        {/* M3 Tonal Surface Information Card */}
        <div className="my-5 p-3.5 rounded-2xl bg-[#282d36] border border-[#3e4450]/60 flex items-center gap-3 text-xs text-[#c5c5d4]">
          <div className="w-8 h-8 rounded-full bg-[#1e2229] text-[#5F7ADB] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[11px] text-[#9ca3af] font-medium">Lokasi Cadangan (Default):</span>
            <span className="text-xs font-semibold text-white truncate block">
              Kota Bekasi, Jawa Barat (-6.2383, 106.9756)
            </span>
          </div>
        </div>

        {/* Error Alert if any */}
        {locationError && (
          <div className="mb-4 p-3 rounded-2xl bg-[#371e21] border border-[#5c2529] text-[#ffb4ab] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb4ab]" />
            <span className="flex-1">{locationError}</span>
          </div>
        )}

        {/* M3 Action Row */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
          <button
            id="use-default-location-btn"
            type="button"
            onClick={handleDefault}
            disabled={isLocating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-[#c5c5d4] hover:text-white hover:bg-[#2c313c] transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Gunakan Default (Bekasi)
          </button>

          <button
            id="allow-location-btn"
            type="button"
            onClick={handleAllow}
            disabled={isLocating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-[#5F7ADB] hover:bg-[#4d69d4] active:bg-[#3d59c4] text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isLocating ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Mendeteksi Lokasi...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Izinkan Lokasi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
