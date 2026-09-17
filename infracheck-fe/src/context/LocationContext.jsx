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
  refreshLocation: () => {},
  resetLocation: () => {},
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

  // Refresh live device GPS location (forces maximumAge: 0 to avoid stale cached position)
  const refreshLocation = useCallback((options = {}) => {
    const {
      silent = false,
      onSuccess,
      onError,
      maxAge = 0,
      timeout = 10000,
    } = options;

    if (!navigator.geolocation) {
      const err = 'Browser Anda tidak mendukung deteksi lokasi GPS.';
      if (!silent) setLocationError(err);
      onError && onError(err);
      return;
    }

    if (!silent) {
      setIsLocating(true);
      setLocationError(null);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        setUserLocation(coords);
        setPermissionStatus('granted');
        if (!silent) setIsLocating(false);
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
        console.warn('Geolocation access error:', err);
        let errorMsg = 'Izin akses lokasi tidak diberikan atau gagal terdeteksi.';
        if (err.code === 1) {
          errorMsg = 'Akses lokasi ditolak oleh browser/pengguna.';
          setPermissionStatus('denied');
          try {
            localStorage.setItem('infracheck_location_status', 'denied');
          } catch (e) {
            console.warn(e);
          }
        } else if (err.code === 2) {
          errorMsg = 'Sinyal GPS atau lokasi tidak dapat ditemukan.';
        } else if (err.code === 3) {
          errorMsg = 'Waktu permintaan lokasi GPS habis.';
        }

        if (!silent) {
          setLocationError(errorMsg);
          setIsLocating(false);
        }
        onError && onError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: maxAge,
      }
    );
  }, []);

  // Request real device GPS location (interactive flow)
  const requestLocation = useCallback(
    (onSuccess, onError) => {
      refreshLocation({
        silent: false,
        maxAge: 0,
        onSuccess,
        onError,
      });
    },
    [refreshLocation]
  );

  // Reset stored location preference and re-open location prompt
  const resetLocation = useCallback(() => {
    setUserLocation(null);
    setPermissionStatus('prompt');
    setLocationError(null);
    setIsLocating(false);
    try {
      localStorage.removeItem('infracheck_user_coords');
      localStorage.removeItem('infracheck_location_status');
    } catch (e) {
      console.warn(e);
    }
    setIsPromptOpen(true);
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

  // Automatically refresh coordinates on mount if permission was already granted
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (permissionStatus === 'granted') {
      // Silently query fresh device GPS coordinates so returning users aren't locked to stale coords
      refreshLocation({ silent: true, maxAge: 0 });
    } else if (navigator.permissions && permissionStatus !== 'default' && permissionStatus !== 'denied') {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          if (permission.state === 'granted') {
            refreshLocation({ silent: true, maxAge: 0 });
          }
        })
        .catch(() => {});
    }
  }, [permissionStatus, refreshLocation]);

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
        refreshLocation,
        resetLocation,
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
