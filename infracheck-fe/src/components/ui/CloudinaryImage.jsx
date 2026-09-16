import React, { useState } from 'react';
import { AdvancedImage, placeholder, responsive } from '@cloudinary/react';
import { extractPublicId, getCloudinaryImage } from '../../services/cloudinary';

/**
 * CloudinaryImage Component
 *
 * Utilizes @cloudinary/react and @cloudinary/url-gen for fast CDN delivery,
 * blur-up placeholders, and responsive image sizing.
 * Automatically falls back to standard HTML <img> if the image is from an external source.
 */
const CloudinaryImage = ({
  src,
  publicId: propPublicId,
  alt = 'Foto Kerusakan',
  className = '',
  width,
  height,
  crop = 'fill',
  enablePlaceholder = true,
  enableResponsive = true,
  fallbackSrc = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80',
  onClick,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  // If publicId prop or a Cloudinary URL is provided, build a CloudinaryImage object
  const publicId = propPublicId || (src ? extractPublicId(src) : null);

  if (publicId && !hasError) {
    try {
      const cldImg = getCloudinaryImage(publicId, {
        width,
        height,
        crop,
        quality: 'auto',
        format: 'auto',
      });

      if (cldImg) {
        const plugins = [];
        if (enablePlaceholder) {
          plugins.push(placeholder({ mode: 'blur' }));
        }
        if (enableResponsive) {
          plugins.push(responsive({ steps: [320, 640, 1024] }));
        }

        return (
          <AdvancedImage
            cldImg={cldImg}
            plugins={plugins}
            alt={alt}
            className={className}
            onClick={onClick}
            onError={() => setHasError(true)}
            {...rest}
          />
        );
      }
    } catch (err) {
      console.warn('AdvancedImage rendering fallback to img:', err);
    }
  }

  // Fallback to standard <img> for non-Cloudinary URLs or on load error
  const displaySrc = hasError ? fallbackSrc : (src || fallbackSrc);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading="lazy"
      onClick={onClick}
      onError={(e) => {
        if (!hasError && fallbackSrc && e.currentTarget.src !== fallbackSrc) {
          setHasError(true);
          e.currentTarget.src = fallbackSrc;
        }
      }}
      {...rest}
    />
  );
};

export default CloudinaryImage;
