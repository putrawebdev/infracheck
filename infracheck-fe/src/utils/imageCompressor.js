/**
 * Client-Side Image Compression Utility
 *
 * Uses HTML5 Canvas to downscale and re-encode high-resolution smartphone camera
 * photos (typically 5MB - 15MB) into lightweight, high-clarity WebP / JPEG images (~150KB - 400KB)
 * directly in the browser before sending to the backend.
 *
 * Zero external npm dependencies.
 */

/**
 * Checks if the browser supports WebP canvas export.
 */
const supportsWebpExport = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

/**
 * Compresses an image File or Blob.
 *
 * @param {File|Blob} file - The raw input file from camera/gallery.
 * @param {Object} [options] - Compression options.
 * @param {number} [options.maxWidth=1600] - Maximum width constraint.
 * @param {number} [options.maxHeight=1600] - Maximum height constraint.
 * @param {number} [options.quality=0.82] - Compression quality (0 to 1).
 * @param {number} [options.skipBelowBytes=250000] - Skip re-encoding if already under ~250KB.
 * @returns {Promise<{file: File, originalSize: number, compressedSize: number, savedPercent: number, previewUrl: string}>}
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    skipBelowBytes = 250 * 1024, // 250KB
  } = options;

  if (!file || !(file instanceof Blob) || !file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file?.size || 0,
      compressedSize: file?.size || 0,
      savedPercent: 0,
      previewUrl: file ? URL.createObjectURL(file) : '',
    };
  }

  // Skip SVGs and Animated GIFs to prevent breaking them
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  const originalSize = file.size;

  // If file is already small (< 250KB), return as is
  if (originalSize <= skipBelowBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      previewUrl: URL.createObjectURL(file),
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        previewUrl: URL.createObjectURL(file),
      });
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          savedPercent: 0,
          previewUrl: URL.createObjectURL(file),
        });
      };

      img.onload = () => {
        let { width, height } = img;

        // Proportional resize
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            savedPercent: 0,
            previewUrl: URL.createObjectURL(file),
          });
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        const useWebp = supportsWebpExport();
        const exportMime = useWebp ? 'image/webp' : 'image/jpeg';
        const rawFileName = file.name || `photo_${Date.now()}.jpg`;
        const newFileName = useWebp
          ? rawFileName.replace(/\.[^.]+$/, '.webp')
          : rawFileName.replace(/\.[^.]+$/, '.jpg');

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= originalSize) {
              // If compressed size is somehow larger, keep original
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                savedPercent: 0,
                previewUrl: URL.createObjectURL(file),
              });
              return;
            }

            const compressedFile = new File([blob], newFileName, {
              type: exportMime,
              lastModified: Date.now(),
            });

            const savedPercent = Math.max(
              0,
              Math.round(((originalSize - compressedFile.size) / originalSize) * 100)
            );

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: compressedFile.size,
              savedPercent,
              previewUrl: URL.createObjectURL(compressedFile),
            });
          },
          exportMime,
          quality
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes to readable human string (e.g. "3.4 MB", "280 KB")
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
