/**
 * Centralized report helpers for coordinate parsing, headline titles,
 * urgency badges, and map pin styling across the application.
 */

export const BEKASI_DEFAULT_COORDS = [-6.2383, 106.9756];

/**
 * Resolves numerical latitude and longitude from report object.
 * Falls back to default Bekasi coordinates if invalid.
 */
export const getReportCoords = (report) => {
  const lat = Number(report?.latitude);
  const lng = Number(report?.longitude);
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return [lat, lng];
  }
  const mx = Number(report?.map_x ?? 50);
  const my = Number(report?.map_y ?? 50);
  return [
    BEKASI_DEFAULT_COORDS[0] - (my - 50) * 0.0018,
    BEKASI_DEFAULT_COORDS[1] + (mx - 50) * 0.003,
  ];
};

/**
 * Marker Color and Styling Configuration based on report status and urgency:
 * - Hijau = di tangani / selesai
 * - Merah = High / Critical
 * - Oranye = Medium
 * - Kuning = Low
 */
export const getMarkerColorConfig = (report) => {
  const status = String(report?.status || '').toLowerCase().trim();
  const urgency = String(report?.urgency || '').toLowerCase().trim();

  // 1. Hijau = di tangani / selesai
  if (
    status === 'done' ||
    status === 'selesai' ||
    status === 'resolved' ||
    status === 'ditangani' ||
    status === 'di tangani' ||
    status === 'di_tangani'
  ) {
    return {
      name: 'ditangani',
      label: 'Di Tangani',
      mainColor: '#10B981', // Emerald 500
      lightColor: '#34D399', // Emerald 400
      glowColor: 'rgba(16, 185, 129, 0.6)',
      dotClass: 'bg-emerald-500',
    };
  }

  // 2. Merah = High / Critical
  if (
    urgency === 'high' ||
    urgency === 'tinggi' ||
    urgency === 'critical' ||
    urgency === 'kritis'
  ) {
    return {
      name: 'high',
      label: 'High',
      mainColor: '#EF4444', // Red 500
      lightColor: '#F87171', // Red 400
      glowColor: 'rgba(239, 68, 68, 0.6)',
      dotClass: 'bg-red-500',
    };
  }

  // 3. Oranye = Medium
  if (
    urgency === 'medium' ||
    urgency === 'sedang'
  ) {
    return {
      name: 'medium',
      label: 'Medium',
      mainColor: '#F97316', // Orange 500
      lightColor: '#FB923C', // Orange 400
      glowColor: 'rgba(249, 115, 22, 0.6)',
      dotClass: 'bg-orange-500',
    };
  }

  // 4. Kuning = Low (default)
  return {
    name: 'low',
    label: 'Low',
    mainColor: '#EAB308', // Yellow 500
    lightColor: '#FACC15', // Yellow 400
    glowColor: 'rgba(234, 179, 8, 0.6)',
    dotClass: 'bg-yellow-500',
  };
};

/**
 * Returns a human-friendly headline for a report.
 * If user provided an input headline/title, use it.
 * Otherwise falls back to "Laporan {Category}".
 */
export const getReportHeadline = (report) => {
  if (!report) return 'Laporan Infrastruktur';
  const categoryName =
    report.category_name ||
    report.category?.name ||
    (typeof report.category === 'string' ? report.category : 'Infrastruktur');
  const raw = report.headline || report.title;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();
    const isCoordinateTitle =
      lower.includes('titik koordinat') ||
      lower.includes('titik gps') ||
      /^kerusakan di\s*(\(?titik|\(?-?\d)/i.test(lower);
    if (!isCoordinateTitle) {
      return trimmed;
    }
  }
  return `Laporan ${categoryName}`;
};

/**
 * Returns urgency badge metadata with text and styling.
 */
export const getUrgencyBadge = (urgency) => {
  const u = String(urgency || 'medium').toLowerCase();
  switch (u) {
    case 'critical':
    case 'kritis':
      return { text: 'Urgensi Kritis', bg: 'bg-red-600 text-white', color: '#EF4444' };
    case 'high':
    case 'tinggi':
      return { text: 'Urgensi Tinggi', bg: 'bg-orange-600 text-white', color: '#F97316' };
    case 'medium':
    case 'sedang':
      return { text: 'Urgensi Sedang', bg: 'bg-amber-600 text-white', color: '#F59E0B' };
    case 'low':
    case 'rendah':
    default:
      return { text: 'Urgensi Rendah', bg: 'bg-emerald-600 text-white', color: '#10B981' };
  }
};
