import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale, limitFit } from '@cloudinary/url-gen/actions/resize';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as qualityAuto } from '@cloudinary/url-gen/qualifiers/quality';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '';

/**
 * Global Cloudinary instance initialized with project cloud configuration.
 */
export const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME || 'demo',
    apiKey: API_KEY || undefined,
  },
  url: {
    secure: true,
  },
});

/**
 * Checks if the user has configured Cloudinary credentials in .env
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    CLOUD_NAME &&
    CLOUD_NAME !== 'demo' &&
    UPLOAD_PRESET
  );
};

/**
 * Extracts publicId from a full Cloudinary URL.
 * Handles both root and subfolder paths, e.g.:
 * https://res.cloudinary.com/demo/image/upload/v12345/infracheck/reports/sample.jpg -> infracheck/reports/sample
 */
export const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const uploadIdx = url.indexOf('/image/upload/');
    if (uploadIdx === -1) return null;

    let pathAfterUpload = url.substring(uploadIdx + '/image/upload/'.length);

    // Strip transformation parameters if present (e.g. c_fill,w_300/...)
    if (/^[a-z]_[^/]+\//.test(pathAfterUpload)) {
      pathAfterUpload = pathAfterUpload.replace(/^[a-z]_[^/]+\//, '');
    }

    // Strip version prefix if present (e.g. v1715000000/)
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    // Strip file extension (.jpg, .png, .webp, etc.)
    const dotIdx = pathAfterUpload.lastIndexOf('.');
    if (dotIdx !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, dotIdx);
    }

    return decodeURIComponent(pathAfterUpload);
  } catch (err) {
    console.warn('Failed to extract Cloudinary public_id:', err);
    return null;
  }
};

/**
 * Builds an optimized CloudinaryImage object using @cloudinary/url-gen.
 *
 * @param {string} urlOrPublicId - Full Cloudinary URL or publicId
 * @param {Object} options
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {'fill'|'scale'|'limit'} [options.crop='fill']
 * @returns {import('@cloudinary/url-gen').CloudinaryImage|null}
 */
export const getCloudinaryImage = (urlOrPublicId, options = {}) => {
  if (!urlOrPublicId) return null;

  const publicId = extractPublicId(urlOrPublicId) || urlOrPublicId;
  if (!publicId) return null;

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format: fmt = 'auto',
  } = options;

  const img = cld.image(publicId);

  if (width || height) {
    if (crop === 'limit') {
      img.resize(limitFit().width(width).height(height));
    } else if (crop === 'scale') {
      img.resize(scale().width(width).height(height));
    } else {
      img.resize(fill().width(width).height(height));
    }
  }

  if (fmt === 'auto') {
    img.format(auto());
  }

  if (quality === 'auto') {
    img.quality(qualityAuto());
  }

  return img;
};

/**
 * Direct client-side unsigned upload to Cloudinary.
 * Uploads compressed image directly without storing binary files in the database.
 *
 * @param {File|Blob} file - The file or blob to upload
 * @param {Object} [options]
 * @param {string} [options.folder='infracheck/reports'] - Cloudinary target folder
 * @param {Array<string>} [options.tags=['infracheck', 'report']]
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number, format: string, bytes: number }>}
 */
export const uploadToCloudinary = async (file, options = {}) => {
  const cloudName = CLOUD_NAME || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = UPLOAD_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || cloudName === 'demo') {
    throw new Error(
      'Cloudinary Cloud Name belum diatur di .env (VITE_CLOUDINARY_CLOUD_NAME).'
    );
  }

  if (!uploadPreset) {
    throw new Error(
      'Cloudinary Upload Preset belum diatur di .env (VITE_CLOUDINARY_UPLOAD_PRESET).'
    );
  }

  const {
    folder = 'infracheck/reports',
    tags = ['infracheck', 'report'],
  } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (folder) {
    formData.append('folder', folder);
  }

  if (tags && tags.length > 0) {
    formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
  }

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || `HTTP ${response.status}: Gagal mengunggah foto ke Cloudinary`;
    throw new Error(errorMsg);
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
};
