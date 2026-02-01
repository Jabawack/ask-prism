'use client';

import { useState, useRef } from 'react';
import { ProcessingModeSelector, ProcessingMode } from './ProcessingModeSelector';

interface DocumentUploadProps {
  onUpload: (file: File, mode: ProcessingMode) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function DocumentUpload({ onUpload, disabled, compact = false }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('basic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectFile = async (file: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.txt', '.docx'];

    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setError('Please upload a PDF, TXT, or DOCX file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError(null);

    // In compact mode, auto-upload with default processing mode
    if (compact) {
      setIsUploading(true);
      try {
        await onUpload(file, 'basic');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile, processingMode);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // Compact mode: just a button
  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload PDF
            </>
          )}
        </button>
        {error && (
          <p className="absolute top-full mt-1 text-xs text-red-600 whitespace-nowrap">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={disabled || isUploading || !!selectedFile}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📄</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
              disabled={isUploading}
            >
              ✕
            </button>
          </div>
        ) : isUploading ? (
          <div>
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p className="text-gray-600">Processing document...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600">
              Drag and drop a file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF, TXT, DOCX (max 10MB)
            </p>
          </>
        )}
      </div>

      {/* Processing Mode Selector - only show when file is selected */}
      {selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf') && (
        <ProcessingModeSelector
          value={processingMode}
          onChange={setProcessingMode}
          disabled={isUploading}
        />
      )}

      {/* Upload Button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading || disabled}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isUploading || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Processing...' : 'Upload Document'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
