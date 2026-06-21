import { useRef, useState, useCallback } from "react";
import UploadArrowIcon from "../icons/UploadArrowIcon";
import { isValidFile, getFileTypeErrorMessage } from "../../utils/fileValidation";

export default function UploadDropzone({ onFileSelect, onError }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState(null);

  const safeSelect = useCallback(
    (file) => {
      if (typeof onFileSelect !== "function") {
        throw new Error(
          `UploadDropzone: onFileSelect must be a function, got ${typeof onFileSelect}`
        );
      }

      setInvalidMessage(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragError(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];

      if (!isValidFile(file)) {
        const message = getFileTypeErrorMessage(file);
        setDragError(true);
        setInvalidMessage(message);
        setTimeout(() => setDragError(false), 1000);
        onError?.(message);
        return;
      }

      safeSelect(file);
    },
    [safeSelect, onError]
  );

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!isValidFile(file)) {
        const message = getFileTypeErrorMessage(file);
        setDragError(true);
        setInvalidMessage(message);
        setTimeout(() => setDragError(false), 1000);
        onError?.(message);
        e.target.value = "";
        return;
      }

      safeSelect(file);
      e.target.value = "";
    },
    [safeSelect, onError]
  );

  return (
    <div
      className={`w-3/4 h-[428px] bg-bg-cards1 rounded-lg flex flex-col items-center justify-center border border-dashed transition-colors cursor-pointer font-sans ${
        isDragging
          ? "border-primary bg-bg-mainColor30"
          : dragError
          ? "border-status-risk bg-bg-atRisk20030"
          : "border-gray-200 shadow-[0_2px_8px_rgba(136,136,136,0.1)]"
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center gap-6 w-[540px]">
        <UploadArrowIcon className="w-12 h-12 text-primary" />

        <div className="text-center">
          <p className="text-lg font-medium text-text-primary leading-5 mb-6">
            Drag and Drop Your Contract Here
          </p>
          <p className="text-xs text-text-secondary">
            or click to browse (PDF only, max 50 MB)
          </p>
          {invalidMessage && (
            <p className="text-xs text-status-risk mt-2 max-w-[420px] mx-auto">
              {invalidMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="h-10 px-4 bg-primary rounded-[28px] shadow-[0_2px_8px_rgba(136,136,136,0.1)] flex items-center gap-2 text-xs text-text-light font-normal hover:opacity-90 transition-opacity"
        >
          <UploadArrowIcon className="w-5 h-5 text-text-light" noBackground />
          Browse Files
        </button>

        <p className="text-xs text-text-secondary text-center">
          Your files are encrypted and secure. The original PDF never
          leaves your workspace.
        </p>
      </div>
    </div>
  );
}