/**
 * PdfUpload - PDF upload component with drag & drop
 */

import { useCallback, useState } from 'react';
import { FileUp, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfUploadProps {
  file: File | null;
  isExtracting: boolean;
  extractedText: string;
  error: string | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
}

export function PdfUpload({
  file,
  isExtracting,
  extractedText,
  error,
  onFileSelect,
  onFileClear,
}: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.toLowerCase().endsWith('.pdf')) {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf')) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file ? (
          // Upload area
          <motion.label
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`block cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-moon bg-moon/10'
                : 'border-border/50 hover:border-moon/50 hover:bg-card/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp
              className={`w-8 h-8 mx-auto mb-2 transition-colors ${
                isDragging ? 'text-moon' : 'text-muted-foreground'
              }`}
            />
            <p className="text-sm text-muted-foreground">
              PDF hochladen{' '}
              <span className="text-moon/70">(optional)</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Arbeitsblatt, Lehrbuchseite, Skript...
            </p>
            <p className="text-xs text-muted-foreground/50 mt-2">
              Drag & Drop oder klicken
            </p>
          </motion.label>
        ) : (
          // File preview
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-border/50 rounded-xl p-4 bg-card/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    error
                      ? 'bg-destructive/20'
                      : extractedText
                      ? 'bg-aurora/20'
                      : 'bg-moon/20'
                  }`}
                >
                  {isExtracting ? (
                    <Loader2 className="w-5 h-5 text-moon animate-spin" />
                  ) : error ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <FileText
                      className={`w-5 h-5 ${
                        extractedText ? 'text-aurora' : 'text-moon'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                    {isExtracting && ' • Text wird extrahiert...'}
                    {extractedText && !isExtracting && ' • Bereit'}
                    {error && ' • Fehler'}
                  </p>
                </div>
              </div>
              <button
                onClick={onFileClear}
                className="p-1 rounded-md hover:bg-secondary transition-colors flex-shrink-0"
                disabled={isExtracting}
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {/* Extracted text preview */}
            {extractedText && !error && (
              <div className="mt-3 p-3 rounded-lg bg-moon/5 border border-moon/20">
                <p className="text-xs text-moon font-medium mb-1">
                  Extrahierter Text:
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {extractedText.slice(0, 300)}
                  {extractedText.length > 300 && '...'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
