import React, { useState, useRef } from 'react';
import { CLOUDINARY_PRESET_NAME, CLOUDINARY_CLOUD_NAME } from '../assets/Configuration/config';

// Función para comprimir imágenes usando canvas
async function compressImage(file, maxSizeMB = 9, maxWidth = 1920, maxHeight = 1920, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        // Redimensionar si es necesario
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((maxHeight / height) * width);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Comprimir a JPEG
        canvas.toBlob(
          blob => {
            if (!blob) return reject(new Error('Compression failed'));
            // Si sigue siendo muy grande, reducir calidad
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              // Llamada recursiva con menor calidad
              compressImage(file, maxSizeMB, maxWidth, maxHeight, quality - 0.1).then(resolve).catch(reject);
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const CloudinaryUpload = ({ onUpload, multiple = false }) => {
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const uploadImage = async (e) => {
    setError('');
    const files = e.target.files;
    if (!files || !files[0]) return;

    setLoading(true);

    if (multiple) {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        try {
          // Comprimir imagen antes de subir
          const compressed = await compressImage(files[i]);
          const data = new FormData();
          data.append('file', compressed);
          data.append('upload_preset', CLOUDINARY_PRESET_NAME);
          const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: data
          });
          const file = await response.json();
          if (file.secure_url) {
            urls.push(file.secure_url);
          } else {
            setError(file.error?.message || 'Upload failed');
          }
        } catch (error) {
          setError('Error uploading image: ' + error.message);
        }
      }
      setImage(urls[0] || '');
      setLoading(false);
      if (onUpload) onUpload(urls);
    } else {
      try {
        // Comprimir imagen antes de subir
        const compressed = await compressImage(files[0]);
        const data = new FormData();
        data.append('file', compressed);
        data.append('upload_preset', CLOUDINARY_PRESET_NAME);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: data
        });
        const file = await response.json();
        if (file.secure_url) {
          setImage(file.secure_url);
          if (onUpload) onUpload(file.secure_url);
        } else {
          setError(file.error?.message || 'Upload failed');
        }
        setLoading(false);
      } catch (error) {
        setError('Error uploading image: ' + error.message);
        setLoading(false);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <input
        type="file"
        name="file"
        placeholder="Upload an image"
        ref={fileInputRef}
        onChange={uploadImage}
        accept="image/*"
        multiple={multiple}
      />
      {loading ? (
        <h3>Loading...</h3>
      ) : (
        image && <img src={image} alt="imagen subida" style={{ maxWidth: 200, marginTop: 10 }} />
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
