'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadService } from '@/services/upload.service';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (value.length + acceptedFiles.length > maxFiles) {
        toast.error(`Tối đa ${maxFiles} ảnh`);
        return;
      }
      setUploading(true);
      try {
        const uploaded = await Promise.all(acceptedFiles.map((file) => uploadService.uploadImage(file)));
        const urls = uploaded.map((r) => (typeof r === 'string' ? r : r.url));
        onChange([...value, ...urls]);
      } catch {
        toast.error('Tải ảnh thất bại');
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: maxFiles - value.length,
    disabled: value.length >= maxFiles || uploading,
  });

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Dropzone */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="text-sm">Đang tải lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="h-8 w-8" />
              <p className="text-sm">
                {isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả hoặc click để chọn ảnh'}
              </p>
              <p className="text-xs">JPG, PNG, WEBP — tối đa {maxFiles - value.length} ảnh</p>
            </div>
          )}
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary-500 text-white px-1 rounded">
                  Chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
