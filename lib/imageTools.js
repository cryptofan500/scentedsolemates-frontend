// Client-side compression WITH EXIF preservation for fake detection

/**
 * Compress image while PRESERVING EXIF metadata
 * Uses browser-image-compression library (NOT canvas - canvas strips EXIF)
 */
export async function compressImage(file, options = {}) {
  const { maxSizeMB = 0.5, maxWidthOrHeight = 1600 } = options;
  
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image.');
  }

  if (file.type.includes('heic') || file.type.includes('heif')) {
    throw new Error('HEIC/HEIF not supported. Please use JPG, PNG, or WebP.');
  }

  // If already small enough, return as-is (preserves EXIF)
  if (file.size < maxSizeMB * 1024 * 1024) {
    console.log('[COMPRESS] File already small, preserving EXIF');
    return file;
  }

  try {
    // CRITICAL: Use imageCompression library, NOT canvas
    // Canvas re-encode strips EXIF - we need EXIF for fake detection
    const imageCompression = (await import('browser-image-compression')).default;
    
    const compressed = await imageCompression(file, {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: true, // KEY: Keep EXIF data
      initialQuality: 0.85
    });
    
    console.log(`[COMPRESS] ${file.size} → ${compressed.size} bytes (EXIF preserved)`);
    return compressed;
    
  } catch (error) {
    console.error('Compression error:', error);
    // Fallback: Return original file with EXIF intact
    return file;
  }
}

export function validateImageFile(file) {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Use JPG, PNG, or WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Image too large. Maximum 10MB before compression.');
  }
  
  return true;
}