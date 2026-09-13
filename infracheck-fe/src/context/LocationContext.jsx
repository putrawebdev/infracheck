import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

export const BEKASI_DEFAULT_COORDS = [-6.2383, 106.9756];
export const BEKASI_DEFAULT_NAME = 'Kota Bekasi, Jawa Barat';

export const LocationContext = createContext({
  userLocation: null,
  activeLocation: BEKASI_DEFAULT_COORDS,
  locationName: BEKASI_DEFAULT_NAME,
  permissionStatus: 'prompt', // 'prompt' | 'granted' | 'denied' | 'default'
  isPromptOpen: false,
  isLocating: false,
  locationError: null,
  requestLocation: async () => {},
  useDefaultBekasi: () => {},
  openPrompt: () => {},
  closePrompt: () => {},
  hasUserLocation: false,
});

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('infracheck_user_coords');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [permissionStatus, setPermissionStatus] = useState(() => {
    try {
      return localStorage.getItem('infracheck_location_status') || 'prompt';
    } catch {
      return 'prompt';
    }
  });

  const [isPromptOpen, setIsPromptOpen] = useState(() => {
    try {
      const status = localStorage.getItem('infracheck_location_status');
      // If user hasn't made any choice yet, show the popup automatically on website open
      return !status || status === 'prompt';
    } catch {
      return true;
    }
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Active coordinates used by map & forms
  const activeLocation = userLocation
    ? [userLocation.lat, userLocation.lng]
    : BEKASI_DEFAULT_COORDS;

  const locationName = userLocation
    ? 'Lokasi Anda (GPS Akurat)'
    : BEKASI_DEFAULT_NAME;

  const hasUserLocation = Boolean(userLocation && userLocation.lat && userLocation.lng);

  // Request real device GPS location
  const requestLocation = useCallback((onSuccess, onError) => {
    if (!navigator.geolocation) {
      const err = 'Browser Anda tidak mendukung deteksi lokasi GPS.';
      setLocationError(err);
      setPermissionStatus('denied');
      try {
        localStorage.setItem('infracheck_location_status', 'denied');
      } catch (e) {
        console.warn(e);
      }
      setIsPromptOpen(false);
      onError && onError(err);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setPermissionStatus('granted');
        setIsLocating(false);
        setIsPromptOpen(false);

        try {
          localStorage.setItem('infracheck_location_status', 'granted');
          localStorage.setItem('infracheck_user_coords', JSON.stringify(coords));
        } catch (e) {
          console.warn(e);
        }

        onSuccess && onSuccess(coords);
      },
      (err) => {
        console.warn('Geolocation access denied or failed:', err);
        let errorMsg = 'Izin akses lokasi tidak diberikan atau gagal terdeteksi.';
        if (err.code === 1) {
          errorMsg = 'Akses lokasi ditolak oleh pengguna.';
        } else if (err.code === 2) {
          errorMsg = 'Lokasi tidak dapat ditemukan.';
        } else if (err.code === 3) {
          errorMsg = 'Waktu permintaan lokasi habis.';
        }

        setLocationError(errorMsg);
        setPermissionStatus('denied');
        setIsLocating(false);
        setIsPromptOpen(false);

        try {
          localStorage.setItem('infracheck_location_status', 'denied');
        } catch (e) {
          console.warn(e);
        }

        onError && onError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Explicitly choose default Bekasi location
  const useDefaultBekasi = useCallback(() => {
    setPermissionStatus('default');
    setUserLocation(null);
    setIsPromptOpen(false);
    setLocationError(null);
    try {
      localStorage.setItem('infracheck_location_status', 'default');
      localStorage.removeItem('infracheck_user_coords');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const openPrompt = useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  // Auto-refresh coordinates if permission was already granted previously
  useEffect(() => {
    if (permissionStatus === 'granted' && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setUserLocation(coords);
        },
        () => {
          // Keep default if GPS fails
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [permissionStatus, userLocation]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        activeLocation,
        locationName,
        permissionStatus,
        isPromptOpen,
        isLocating,
        locationError,
        requestLocation,
        useDefaultBekasi,
        openPrompt,
        closePrompt,
        hasUserLocation,
        BEKASI_DEFAULT_COORDS,
        BEKASI_DEFAULT_NAME,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
