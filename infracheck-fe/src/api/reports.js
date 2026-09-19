import api from './axios';

export const normalizeReport = (r) => {
  if (!r || typeof r !== 'object') return r;
  const id = r.id || Date.now();
  const rawCategory = r.category;
  const categoryName =
    r.category_name ||
    (typeof rawCategory === 'object' && rawCategory !== null ? rawCategory?.name : rawCategory) ||
    'Jalan Berlubang';
  const categoryObj =
    typeof rawCategory === 'object' && rawCategory !== null
      ? rawCategory
      : { id: r.category_id || 1, name: categoryName };
  const location = r.location || r.location_address || 'Kota Bekasi, Jawa Barat';
  const locationAddress = r.location_address || r.location || location;
  
  const getHeadline = () => {
    const raw = r.headline || r.title;
    if (raw && typeof raw === 'string' && raw.trim()) {
      const trimmed = raw.trim();
      const lower = trimmed.toLowerCase();
      const isCoords =
        lower.includes('titik koordinat') ||
        lower.includes('titik gps') ||
        /^kerusakan di\s*(\(?titik|\(?-?\d)/i.test(lower);
      if (!isCoords) {
        return trimmed;
      }
    }
    return `Laporan ${categoryName}`;
  };

  const title = getHeadline();
  const confirmations = Number(r.confirmation_count ?? r.confirmations ?? 1);

  // Helper to format backend URL for relative storage paths and fix localhost / http mismatches
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed.includes('dummyimage.com')) return null;

    const backendBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');

    // If URL points to localhost or 127.0.0.1 /storage/, re-point to actual production backend base
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\//i.test(trimmed)) {
      return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\//i, `${backendBase}/storage/`);
    }

    if (trimmed.startsWith('/storage/')) {
      return `${backendBase}${trimmed}`;
    }
    if (trimmed.startsWith('storage/')) {
      return `${backendBase}/${trimmed}`;
    }
    return trimmed;
  };

  // Collect all photos from r.images, r.photos, and r.photo_url
  const photoUrlsFromPhotos = Array.isArray(r.photos)
    ? r.photos.map((p) => formatImageUrl(typeof p === 'string' ? p : p?.photo_url)).filter(Boolean)
    : [];

  const rawImages = Array.isArray(r.images)
    ? r.images.map(formatImageUrl).filter(Boolean)
    : [];

  const singlePhoto = formatImageUrl(r.photo_url);

  let combinedImages = [
    ...rawImages,
    ...photoUrlsFromPhotos,
    ...(singlePhoto ? [singlePhoto] : []),
  ];
  combinedImages = Array.from(new Set(combinedImages)).filter(Boolean);

  // If real photos exist, discard any Unsplash or dummy placeholder URLs
  const realPhotos = combinedImages.filter(
    (u) => typeof u === 'string' && !u.includes('unsplash.com') && !u.includes('dummyimage.com')
  );
  if (realPhotos.length > 0) {
    combinedImages = realPhotos;
  }

  const fallbackDefault = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80';
  const photoUrl = combinedImages.length > 0 ? combinedImages[0] : fallbackDefault;
  const images = combinedImages.length > 0 ? combinedImages : [fallbackDefault];

  return {
    ...r,
    id,
    tracking_id: r.tracking_id || `IC-2026-${String(id).padStart(5, '0')}`,
    title,
    location,
    location_address: locationAddress,
    category: categoryObj,
    category_name: categoryName,
    category_id: r.category_id || categoryObj.id || 1,
    confirmations,
    confirmation_count: confirmations,
    photo_url: photoUrl,
    images,
    photos: r.photos || [],
    latitude: Number(r.latitude) || -6.2383,
    longitude: Number(r.longitude) || 106.9756,
    urgency: r.urgency || 'medium',
    status: r.status || 'new',
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || r.created_at || new Date().toISOString(),
    date_reported: r.date_reported || r.created_at || new Date().toISOString(),
    reporter_name: r.reporter_name || 'Warga',
  };
};

// In-memory reports store matching the application specifications and Figma design
let MOCK_REPORTS_LIST = [];

export const getAllReports = async (params = {}) => {
  try {
    const response = await api.get('/reports', { params });
    const list = response?.data?.data ?? response?.data;
    if (Array.isArray(list) && list.length > 0) {
      const normalizedList = list.map(normalizeReport);
      return normalizedList;
    }
    return MOCK_REPORTS_LIST.map(normalizeReport);
  } catch (error) {
    console.warn('API getAllReports fallback to local dataset:', error?.message || error);
    return MOCK_REPORTS_LIST.map(normalizeReport);
  }
};

export const getReportById = async (id) => {
  try {
    const response = await api.get(`/reports/${id}`);
    const item = response?.data?.data ?? response?.data;
    if (item) return normalizeReport(item);
  } catch (error) {
    console.warn('API getReportById fallback to local dataset:', error?.message || error);
  }
  const found = MOCK_REPORTS_LIST.find((r) => String(r.id) === String(id));
  return found ? normalizeReport(found) : null;
};

export const updateReportStatus = async (id, statusData) => {
  try {
    const response = await api.patch(`/reports/${id}/status`, statusData);
    if (response?.data) {
      const item = response.data.data || response.data;
      return {
        success: true,
        data: normalizeReport(item),
        message: response.data.message || 'Status laporan berhasil diperbarui',
      };
    }
  } catch (error) {
    console.warn('API updateReportStatus fallback, mutating local dataset:', error?.message || error);
  }

  // Local fallback mutation
  const newStatus = statusData.status || 'processing';
  const note = statusData.admin_note || statusData.note || '';

  MOCK_REPORTS_LIST = MOCK_REPORTS_LIST.map((r) => {
    if (String(r.id) === String(id)) {
      const updatedTimeline = [
        ...(r.timeline || []),
        {
          id: Date.now(),
          status: newStatus,
          title: `Status Diubah ke: ${newStatus.toUpperCase()}`,
          description: note || `Petugas admin memperbarui status pengerjaan laporan menjadi ${newStatus}.`,
          timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
          actor: 'Admin InfraCheck',
        },
      ];

      return normalizeReport({
        ...r,
        status: newStatus,
        admin_note: note,
        timeline: updatedTimeline,
      });
    }
    return r;
  });

  const updatedReport = MOCK_REPORTS_LIST.find((r) => String(r.id) === String(id));
  return {
    success: true,
    data: updatedReport ? normalizeReport(updatedReport) : { id, status: newStatus },
    message: 'Status laporan berhasil diperbarui',
  };
};

export const generateReportPDF = async (id) => {
  try {
    const response = await api.get(`/reports/${id}/pdf`, {
      responseType: 'blob',
    });

    // Handle case where server responds with application/json inside a blob
    if (response?.data instanceof Blob && response.data.type === 'application/json') {
      const text = await response.data.text();
      let msg = 'Gagal mengunduh dokumen PDF audit dari server.';
      try {
        const json = JSON.parse(text);
        if (json.message) msg = json.message;
      } catch {}
      throw new Error(msg);
    }

    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          if (json.message) {
            throw new Error(json.message);
          }
        } catch (jsonErr) {
          if (jsonErr.message && !jsonErr.message.includes('JSON')) {
            throw jsonErr;
          }
        }

        if (text.includes('<title>')) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            throw new Error(`Server error: ${titleMatch[1]}`);
          }
        }
      } catch (parseErr) {
        if (parseErr.message) {
          throw parseErr;
        }
      }
    }
    console.error('API generateReportPDF error:', error?.message || error);
    throw error;
  }
};

export const confirmReport = async (id) => {
  try {
    let token = localStorage.getItem('infracheck_user_token');
    if (!token) {
      token = 'usr-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('infracheck_user_token', token);
    }
    const response = await api.post(`/reports/${id}/confirm`, { user_token: token });
    if (response?.data) return response.data;
  } catch (error) {
    console.warn('API confirmReport fallback:', error?.message || error);
  }

  let updatedCount = 1;
  MOCK_REPORTS_LIST = MOCK_REPORTS_LIST.map((r) => {
    if (String(r.id) === String(id)) {
      const newConfirmations = Number(r.confirmations || r.confirmation_count || 0) + 1;
      updatedCount = newConfirmations;
      return normalizeReport({
        ...r,
        confirmations: newConfirmations,
        confirmation_count: newConfirmations,
      });
    }
    return r;
  });

  return {
    success: true,
    confirmations: updatedCount,
    message: 'Terima kasih! Konfirmasi dukungan Anda telah dicatat.',
  };
};

export const addReportPhoto = async (id, photoData) => {
  try {
    let token = localStorage.getItem('infracheck_user_token');
    if (!token) {
      token = 'usr-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('infracheck_user_token', token);
    }

    let payload;
    let isFormData = false;

    if (photoData instanceof FormData) {
      payload = photoData;
      if (!payload.get('user_token')) {
        payload.append('user_token', token);
      }
      isFormData = true;
    } else if (typeof photoData === 'string') {
      payload = {
        photo_url: photoData,
        user_token: token,
        caption: 'Bukti Tambahan Warga',
      };
    } else if (photoData && typeof photoData === 'object') {
      payload = {
        user_token: token,
        caption: 'Bukti Tambahan Warga',
        ...photoData,
      };
    }

    const response = await api.post(`/reports/${id}/photos`, payload);
    if (response?.data) return response.data;
  } catch (error) {
    console.warn('API addReportPhoto fallback:', error?.message || error);
  }

  const addedUrl = typeof photoData === 'string' ? photoData : (photoData?.photo_url || '');
  if (addedUrl) {
    MOCK_REPORTS_LIST = MOCK_REPORTS_LIST.map((r) => {
      if (String(r.id) === String(id)) {
        const currentImages = Array.isArray(r.images) ? r.images : [];
        return normalizeReport({
          ...r,
          images: [addedUrl, ...currentImages],
        });
      }
      return r;
    });
  }

  return {
    success: true,
    message: 'Foto bukti berhasil ditambahkan!',
  };
};

export const createReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    if (response?.data) {
      const raw = response.data.data || response.data;
      const normalized = normalizeReport({
        ...raw,
        tracking_id: response.data.tracking_id || raw.tracking_id,
        id: response.data.report_id || raw.id,
      });
      MOCK_REPORTS_LIST = [normalized, ...MOCK_REPORTS_LIST];
      return {
        success: true,
        data: normalized,
        tracking_id: normalized.tracking_id,
        id: normalized.id,
        message: response.data.message || 'Laporan berhasil dibuat',
      };
    }
  } catch (error) {
    console.warn('API createReport fallback, creating local report:', error?.message || error);
  }

  // Local fallback creation
  let title = 'Laporan Kerusakan Baru';
  let description = '';
  let location = 'Lokasi Terdeteksi';
  let category_id = 1;
  let category_name = 'Jalan Berlubang';
  let urgency = 'medium';
  let reporter_name = 'Warga';
  let reporter_phone = '';
  let images = [];
  let latitude = -6.2383;
  let longitude = 106.9756;

  if (reportData instanceof FormData) {
    title = reportData.get('title') || reportData.get('location') || title;
    description = reportData.get('description') || '';
    location = reportData.get('location') || location;
    category_id = Number(reportData.get('category_id')) || 1;
    category_name = reportData.get('category') || reportData.get('category_name') || 'Jalan Berlubang';
    urgency = reportData.get('urgency') || 'medium';
    reporter_name = reportData.get('reporter_name') || 'Warga';
    reporter_phone = reportData.get('reporter_phone') || '';
    latitude = Number(reportData.get('latitude')) || -6.2383;
    longitude = Number(reportData.get('longitude')) || 106.9756;

    const photoUrlString = reportData.get('photo_url');
    const imagesAll = reportData.getAll ? reportData.getAll('images[]').filter(Boolean) : [];
    if (imagesAll.length > 0) {
      images = imagesAll.map((img) => (typeof img === 'string' ? img : URL.createObjectURL(img)));
    } else if (photoUrlString) {
      images = [photoUrlString];
    } else {
      const imageFile = reportData.get('image') || reportData.get('images');
      if (imageFile && typeof imageFile === 'object' && imageFile.name) {
        images = [URL.createObjectURL(imageFile)];
      } else if (typeof imageFile === 'string') {
        images = [imageFile];
      }
    }
  } else if (reportData && typeof reportData === 'object') {
    title = reportData.title || reportData.location || title;
    description = reportData.description || '';
    location = reportData.location || location;
    category_id = Number(reportData.category_id) || 1;
    category_name = reportData.category || reportData.category_name || 'Jalan Berlubang';
    urgency = reportData.urgency || 'medium';
    reporter_name = reportData.reporter_name || 'Warga';
    reporter_phone = reportData.reporter_phone || '';
    latitude = Number(reportData.latitude) || -6.2383;
    longitude = Number(reportData.longitude) || 106.9756;
    images = Array.isArray(reportData.images)
      ? reportData.images
      : reportData.image
      ? [reportData.image]
      : [];
  }

  if (images.length === 0) {
    images = [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80',
    ];
  }

  const nextId = MOCK_REPORTS_LIST.length > 0 ? Math.max(...MOCK_REPORTS_LIST.map((r) => r.id)) + 1 : 1;
  const trackingNumber = String(nextId).padStart(5, '0');
  const tracking_id = `IC-2026-${trackingNumber}`;

  const newReport = normalizeReport({
    id: nextId,
    tracking_id,
    title,
    location,
    location_address: location,
    latitude,
    longitude,
    category_id,
    category: { id: category_id, name: category_name },
    category_name,
    urgency,
    status: 'new',
    status_label: 'Laporan Baru',
    confirmations: 1,
    confirmation_count: 1,
    reporter_name,
    reporter_phone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description,
    images,
    photo_url: images[0],
  });

  MOCK_REPORTS_LIST = [newReport, ...MOCK_REPORTS_LIST];

  return {
    success: true,
    data: newReport,
    tracking_id,
    id: nextId,
    message: 'Laporan berhasil dibuat',
  };
};

export const getReportByTrackingId = async (trackingId) => {
  if (!trackingId) return null;
  const cleanId = String(trackingId).trim().toUpperCase();
  try {
    const response = await api.get(`/reports/track/${cleanId}`);
    const item = response?.data?.data ?? response?.data;
    if (item && (item.tracking_id || item.id)) {
      return normalizeReport(item);
    }
  } catch (error) {
    console.warn('API getReportByTrackingId fallback:', error?.message || error);
  }

  const found = MOCK_REPORTS_LIST.find(
    (r) =>
      r.tracking_id?.toUpperCase() === cleanId ||
      `IC-2026-${String(r.id).padStart(5, '0')}` === cleanId ||
      String(r.id) === cleanId
  );

  return found ? normalizeReport(found) : null;
};

export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  } catch (error) {
    console.warn('API deleteReport fallback, removing from local dataset:', error?.message || error);
    MOCK_REPORTS_LIST = MOCK_REPORTS_LIST.filter((r) => String(r.id) !== String(id));
    return { success: true, message: 'Laporan berhasil dihapus' };
  }
};
