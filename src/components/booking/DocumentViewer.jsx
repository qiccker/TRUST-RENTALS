import { FileText, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function DocumentViewer({ url, label, onClose }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const isPdf = url?.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-3">
          <h3 className="text-lg font-bold text-ink">{label}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-graphite transition hover:bg-mist hover:text-ink"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isPdf ? (
            <iframe
              src={url}
              title={label}
              className="h-[75vh] w-full min-w-[300px] rounded-md border border-line md:min-w-[600px]"
            />
          ) : (
            <img
              src={url}
              alt={label}
              className="max-h-[75vh] w-auto rounded-md"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentThumbnail({ url, label, onClick }) {
  if (!url) {
    return (
      <div className="flex h-20 w-24 items-center justify-center rounded-md border border-dashed border-line bg-mist/30">
        <span className="text-xs text-graphite">No file</span>
      </div>
    );
  }

  const isPdf = url.toLowerCase().endsWith(".pdf");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-md border border-line bg-white transition hover:border-teal hover:shadow-md"
      title={`View ${label}`}
    >
      {isPdf ? (
        <FileText className="h-8 w-8 text-graphite transition group-hover:text-teal" />
      ) : (
        <img src={url} alt={label} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100">
        <span className="w-full truncate px-1 pb-1 text-center text-[10px] font-bold text-white">
          {label}
        </span>
      </div>
    </button>
  );
}

function DocumentReviewPanel({ licenseUrl, idProofUrl }) {
  const [viewerState, setViewerState] = useState({ open: false, url: "", label: "" });

  function openViewer(url, label) {
    setViewerState({ open: true, url, label });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-graphite">License</span>
          <DocumentThumbnail
            url={licenseUrl}
            label="Driving License"
            onClick={() => openViewer(licenseUrl, "Driving License")}
          />
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-graphite">ID Proof</span>
          <DocumentThumbnail
            url={idProofUrl}
            label="ID Proof"
            onClick={() => openViewer(idProofUrl, "ID Proof")}
          />
        </div>
      </div>

      {viewerState.open && (
        <DocumentViewer
          url={viewerState.url}
          label={viewerState.label}
          onClose={() => setViewerState({ open: false, url: "", label: "" })}
        />
      )}
    </>
  );
}

export { DocumentReviewPanel, DocumentThumbnail, DocumentViewer };
