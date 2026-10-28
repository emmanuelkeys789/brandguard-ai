import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { validateImageFile } from '../../services/multimodalReview';

interface ImageUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  previewUrl: string | null;
  altText: string;
  onAltTextChange: (val: string) => void;
  disabled?: boolean;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  previewUrl,
  altText,
  onAltTextChange,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    setErrorMessage(null);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Upload Drop Zone / Active File Card */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            border: dragActive
              ? '2px dashed var(--accent-lime)'
              : '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            background: dragActive
              ? 'rgba(214, 255, 112, 0.06)'
              : 'rgba(255, 255, 255, 0.02)',
            padding: '20px 24px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            disabled={disabled}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(214, 255, 112, 0.08)',
              border: '1px solid var(--accent-lime-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto'
            }}
          >
            <UploadCloud size={20} color="var(--accent-lime)" />
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Attach Marketing Creative or Logo <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Drag and drop or <span style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}>browse</span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Accepts PNG, JPEG, and WEBP creatives (Maximum file size: 4 MB)
          </div>
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(214, 255, 112, 0.04)',
            border: '1px solid var(--accent-lime-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* File Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={altText || 'Uploaded creative preview'}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid var(--border-medium)',
                    background: '#0B0E14'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ImageIcon size={20} color="var(--accent-lime)" />
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>{selectedFile.type.replace('image/', '').toUpperCase()}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-lime)' }}>Ready for Multimodal Audit</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onFileRemove}
              disabled={disabled}
              title="Remove attached creative"
              aria-label="Remove attached creative"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Author Alt Text Field */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '4px'
              }}
            >
              Accessibility Alt Text <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. BrandGuard shield emblem with vibrant lime border on dark carbon background"
              value={altText}
              onChange={(e) => onAltTextChange(e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-medium)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.4 }}>
              Screen reader description. If omitted, BrandGuard AI will honestly report{' '}
              <span style={{ color: '#FBBF24', fontStyle: 'italic' }}>“No alt-text provided by author”</span> in compliance findings.
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '12px',
            color: '#F87171'
          }}
        >
          <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#F87171',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
