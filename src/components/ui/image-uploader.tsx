import { useRef, useState } from "react";
import { Upload, Link2, Loader2, X, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  /** Current image URL (controlled). */
  value: string;
  /** Called when the URL changes — either typed or set after a successful upload. */
  onChange: (url: string) => void;
  /** Placeholder for the URL input mode. */
  placeholder?: string;
  /** Optional: hide the URL input mode and show only the upload button. */
  uploadOnly?: boolean;
  /** Optional: hide the inline image preview. Useful when caller renders its own preview. */
  hidePreview?: boolean;
  /** Optional: classNames merged on the outer wrapper. */
  className?: string;
  /** Optional: smaller compact layout for tight spaces (e.g. inline next to a logo). */
  compact?: boolean;
  /** Optional: aria-label / accessible label for the file picker. */
  ariaLabel?: string;
  /** Optional: notify parent when upload state changes. */
  onUploadingChange?: (uploading: boolean) => void;
};

/**
 * Reusable image picker that supports BOTH:
 *  - URL paste (existing behavior, kept for users who already host their image)
 *  - File upload from the user's device (uploads via POST /api/uploads/image)
 *
 * Returns the absolute https URL via onChange so the existing server-side validation
 * (which requires ^https?:// for article images and length<=500 for logos) keeps working
 * unchanged.
 */
export function ImageUploader({
  value,
  onChange,
  placeholder,
  uploadOnly = false,
  hidePreview = false,
  className = "",
  compact = false,
  ariaLabel,
  onUploadingChange,
}: Props) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"url" | "upload">(uploadOnly ? "upload" : "url");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const resolvedPlaceholder = placeholder ?? (isEn ? "Image URL (optional, https://...)" : "URL imagine (opțional, https://...)");
  const resolvedAriaLabel = ariaLabel ?? (isEn ? "Select image from device" : "Selectează imagine de pe dispozitiv");

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(isEn ? "The file is not an image." : "Fişierul nu este o imagine.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(isEn ? `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).` : `Fişier prea mare (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).`);
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/uploads/image`;
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? (isEn ? `Upload failed (${res.status}).` : `Upload eşuat (${res.status}).`));
        return;
      }
      if (!json?.url || typeof json.url !== "string") {
        setError(isEn ? "Invalid response from server." : "Răspuns invalid de la server.");
        return;
      }
      setPreviewError(false);
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isEn ? "Upload error." : "Eroare la upload."));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  const onPick = () => fileRef.current?.click();

  const previewBox = (
    <div className={`shrink-0 rounded-lg border border-border/40 bg-card flex items-center justify-center overflow-hidden ${compact ? "w-9 h-9" : "w-12 h-12"}`}>
      {value && !previewError ? (
        <img
          src={value}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setPreviewError(true)}
          onLoad={() => setPreviewError(false)}
        />
      ) : (
        <ImageIcon className={`text-muted-foreground/40 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      )}
    </div>
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0 space-y-1.5">
          {!uploadOnly && (
            <div className="flex gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors ${mode === "upload" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted"}`}
                aria-pressed={mode === "upload"}
              >
                <Upload className="h-2.5 w-2.5" /> {isEn ? "Upload from device" : "Încarcă de pe dispozitiv"}
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors ${mode === "url" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:bg-muted"}`}
                aria-pressed={mode === "url"}
              >
                <Link2 className="h-2.5 w-2.5" /> {isEn ? "Paste URL" : "Lipeşte URL"}
              </button>
            </div>
          )}
          {mode === "url" && !uploadOnly && (
            <Input
              value={value}
              onChange={e => { onChange(e.target.value); setPreviewError(false); }}
              placeholder={resolvedPlaceholder}
              className={compact ? "text-xs" : "text-sm"}
              type="url"
              inputMode="url"
              autoComplete="off"
            />
          )}
          {mode === "upload" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPick}
                disabled={uploading}
                aria-label={resolvedAriaLabel}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors ${compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {uploading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {isEn ? "Uploading..." : "Se încarcă..."}</>
                  : <><Upload className="h-3.5 w-3.5" /> {value ? (isEn ? "Replace image" : "Înlocuieşte poza") : (isEn ? "Choose image" : "Alege o poză")}</>}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setPreviewError(false); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
                  title={isEn ? "Delete image" : "Şterge poza"}
                  aria-label={isEn ? "Delete uploaded image" : "Şterge poza încărcată"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              if (e.target) e.target.value = "";
            }}
          />
          {error && <p className="text-[10px] text-rose-500">{error}</p>}
        </div>
        {!hidePreview && previewBox}
      </div>
    </div>
  );
}

export default ImageUploader;
