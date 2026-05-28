import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreview({ file, onRemove }) {
  const isPdf = file.type === "application/pdf";
  const previewUrl = isPdf ? null : URL.createObjectURL(file);

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-line bg-mist/50 p-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white">
        {isPdf ? (
          <FileText className="h-7 w-7 text-graphite" />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
            onLoad={() => previewUrl && URL.revokeObjectURL(previewUrl)}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
        <p className="text-xs text-graphite">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1 text-graphite transition hover:bg-white hover:text-ember"
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadSlot({ label, description, file, onFileSelect, onRemove, error, isUploading }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFileSelect(dropped);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  if (file) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <FilePreview file={file} onRemove={onRemove} />
        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-teal">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading…
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition ${
          error
            ? "border-ember/50 bg-ember/5 hover:border-ember"
            : "border-line bg-mist/30 hover:border-teal hover:bg-mist/60"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10">
          <Upload className="h-5 w-5 text-teal" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink">Click to upload or drag & drop</p>
          <p className="mt-0.5 text-xs text-graphite">{description}</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onFileSelect(selected);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs font-semibold text-ember">{error}</p>}
    </div>
  );
}

function DocumentUpload({ licenseFile, idProofFile, onLicenseChange, onIdProofChange }) {
  const [licenseError, setLicenseError] = useState("");
  const [idProofError, setIdProofError] = useState("");

  function validateAndSet(file, setError, onChange) {
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or PDF files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum is 5 MB.`);
      return;
    }
    onChange(file);
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-teal" />
        <h2 className="text-xl font-black text-ink">Documents</h2>
      </div>
      <p className="text-sm text-graphite">
        Upload clear photos of your driving license and a valid ID proof. Accepted formats: JPEG, PNG, WebP, PDF (max 5 MB each).
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <UploadSlot
          label="Driving License"
          description="Front side of your driving license"
          file={licenseFile}
          onFileSelect={(f) => validateAndSet(f, setLicenseError, onLicenseChange)}
          onRemove={() => { onLicenseChange(null); setLicenseError(""); }}
          error={licenseError}
        />
        <UploadSlot
          label="ID Proof"
          description="Aadhar card, passport, or voter ID"
          file={idProofFile}
          onFileSelect={(f) => validateAndSet(f, setIdProofError, onIdProofChange)}
          onRemove={() => { onIdProofChange(null); setIdProofError(""); }}
          error={idProofError}
        />
      </div>
    </div>
  );
}

export { DocumentUpload };
