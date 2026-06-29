export const uploadProfilePhoto = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  console.log('[DEBUG] Cloudinary Cloud Name:', cloudName);
  console.log('[DEBUG] Cloudinary Upload Preset:', uploadPreset);

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log('[DEBUG] Cloudinary Request URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    console.log('[DEBUG] Cloudinary HTTP Status:', response.status);

    const data = await response.json();
    console.log('[DEBUG] Cloudinary Response Body:', data);

    if (!response.ok) {
      const errorMessage = data.error?.message || 'Failed to upload image to Cloudinary';
      console.error('[DEBUG] Cloudinary Error Message:', errorMessage);
      throw new Error(errorMessage);
    }

    return data.secure_url;
  } catch (error) {
    console.error('[DEBUG] Cloudinary fetch/upload error:', error);
    throw error;
  }
};

export const cropAndResizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      ctx.drawImage(img, startX, startY, size, size, 0, 0, 300, 300);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};
