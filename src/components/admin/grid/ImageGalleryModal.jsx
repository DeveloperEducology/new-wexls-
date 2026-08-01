'use client';

import React, { useState, useEffect } from 'react';

/**
 * Image Gallery Modal (R2 Media Library)
 * Allows selecting previously uploaded R2 images, searching by filename/folder,
 * and direct file uploading directly from inside the gallery.
 */
export default function ImageGalleryModal({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [folderPrefix, setFolderPrefix] = useState('jnvst-questions');
  const [uploading, setUploading] = useState(false);

  // Fetch R2 Images on open or folder prefix change
  useEffect(() => {
    if (!isOpen) return;

    const fetchImages = async () => {
      setLoading(true);
      setError('');
      try {
        const prefixParam = folderPrefix === 'all' ? '' : folderPrefix;
        const res = await fetch(`/api/admin/list-images?prefix=${encodeURIComponent(prefixParam)}`);
        const data = await res.json();
        if (data.images) {
          setImages(data.images);
        } else {
          setError(data.error || 'Failed to load gallery images');
        }
      } catch (err) {
        console.error('Gallery fetch error:', err);
        setError('Error fetching gallery images from R2');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isOpen, folderPrefix]);

  if (!isOpen) return null;

  // Upload file directly inside Gallery
  const handleGalleryFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folderPrefix === 'all' ? 'jnvst-questions' : folderPrefix);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      const newUrl = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url);
      if (newUrl) {
        onSelectImage(newUrl);
        onClose();
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      alert('Error uploading file to gallery');
    } finally {
      setUploading(false);
    }
  };

  // Filter images by search query
  const filteredImages = images.filter(img => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const key = (img.key || '').toLowerCase();
    const url = (img.url || '').toLowerCase();
    return key.includes(query) || url.includes(query);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖼️ R2 Media Gallery ({images.length} Images)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
              Select any existing Cloudflare R2 stored figure or upload a new image.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Filter & Upload Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          {/* Search Box */}
          <input
            type="text"
            placeholder="🔍 Search images by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
          />

          {/* Folder Select */}
          <select
            value={folderPrefix}
            onChange={(e) => setFolderPrefix(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}
          >
            <option value="jnvst-questions">📁 jnvst-questions</option>
            <option value="images">📁 images</option>
            <option value="lkg">📁 lkg</option>
            <option value="all">🌐 All Folders</option>
          </select>

          {/* Direct Upload Button */}
          <label style={{ background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            {uploading ? 'Uploading...' : '➕ Upload New File'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGalleryFileUpload(e.target.files[0])}
            />
          </label>
        </div>

        {/* Image Grid Container */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px', maxHeight: '520px', paddingRight: '4px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', color: '#64748b', fontWeight: 700 }}>
              ⏳ Loading R2 media library...
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fca5a5', fontWeight: 700, textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && filteredImages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontWeight: 700 }}>
              📷 No images found in this folder.
            </div>
          )}

          {!loading && !error && filteredImages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {filteredImages.map((img) => (
                <div
                  key={img.key || img.url}
                  onClick={() => {
                    onSelectImage(img.url);
                    onClose();
                  }}
                  style={{
                    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '14px',
                    padding: '8px', cursor: 'pointer', transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(16,185,129,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img
                      src={img.url}
                      alt={img.key || 'Gallery Image'}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }} title={img.key}>
                    {img.key ? img.key.split('/').pop() : 'Image'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
          >
            Close Gallery
          </button>
        </div>

      </div>
    </div>
  );
}
