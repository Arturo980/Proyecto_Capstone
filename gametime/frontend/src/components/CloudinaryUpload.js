import React, { useState, useRef } from 'react';
import { CLOUDINARY_PRESET_NAME, CLOUDINARY_CLOUD_NAME } from '../assets/Configuration/config';

const CloudinaryUpload = ({ onUpload, multiple = false, showPreview = true }) => {
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
        const data = new FormData();
        data.append('file', files[i]);
        data.append('upload_preset', CLOUDINARY_PRESET_NAME);
        try {
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
      const data = new FormData();
      data.append('file', files[0]);
      data.append('upload_preset', CLOUDINARY_PRESET_NAME);
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: data
        });
        const file = await response.json();
        if (file.secure_url) {
          setImage(file.secure_url);
          if (onUpload) onUpload(file.secure_url); // Notifica al padre la URL para guardar en la base de datos
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
        showPreview && image && <img src={image} alt="imagen subida" style={{ maxWidth: 200, marginTop: 10 }} />
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
