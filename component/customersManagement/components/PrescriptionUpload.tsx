"use client";

import { Prescription, uploadPrescriptions } from "@/app/actions/customers";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { MdClose, MdCloudUpload, MdDescription, MdImage } from "react-icons/md";

// Prescriptions are stored on ImgBB, which only accepts images.
export const PRESCRIPTION_MAX_FILES = 5;
export const PRESCRIPTION_MAX_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

const extensionOf = (name: string) => (name.split(".").pop() || "").toLowerCase();
// Browsers cannot preview HEIC, so show an icon for those
const canPreview = (file: File) => !["heic", "heif"].includes(extensionOf(file.name));

const formatSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Upload the chosen files to ImgBB. Returns the saved file info, or null if the
 * upload failed (an error toast is already shown).
 */
export async function uploadPendingPrescriptions(files: File[]): Promise<Prescription[] | null> {
  if (files.length === 0) return [];
  const data = new FormData();
  files.forEach((file) => data.append("files", file));
  const result = await uploadPrescriptions(data);
  if (!result.success) {
    toast.error(result.error || "Failed to upload prescription");
    return null;
  }
  return result.data;
}

interface PrescriptionUploadProps {
  isDarkMode: boolean;
  /** Files chosen but not uploaded yet (uploaded when the form is saved) */
  pending: File[];
  onPendingChange: (files: File[]) => void;
  /** Prescriptions already saved on the customer (edit page) */
  saved?: Prescription[];
  onRemoveSaved?: (index: number) => void;
  disabled?: boolean;
}

export default function PrescriptionUpload({
  isDarkMode,
  pending,
  onPendingChange,
  saved = [],
  onRemoveSaved,
  disabled = false,
}: PrescriptionUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Local preview URLs for the chosen files
  const previews = useMemo(
    () => pending.map((file) => (canPreview(file) ? URL.createObjectURL(file) : null)),
    [pending]
  );
  useEffect(
    () => () => previews.forEach((url) => url && URL.revokeObjectURL(url)),
    [previews]
  );

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
        toast.error(`${file.name}: only images (JPG, PNG, WEBP, GIF, HEIC) can be uploaded`);
        continue;
      }
      if (file.size > PRESCRIPTION_MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${PRESCRIPTION_MAX_SIZE_MB}MB`);
        continue;
      }
      accepted.push(file);
    }

    const room = PRESCRIPTION_MAX_FILES - pending.length;
    if (accepted.length > room) {
      toast.error(`You can add up to ${PRESCRIPTION_MAX_FILES} files at a time`);
    }
    if (room > 0 && accepted.length > 0) {
      onPendingChange([...pending, ...accepted.slice(0, room)]);
    }
  };

  const tileClass = `relative group rounded-xl border overflow-hidden ${
    isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
  }`;
  const removeButtonClass =
    "absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors disabled:opacity-50";

  return (
    <div>
      {/* Drop area */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-colors ${
          isDarkMode
            ? "border-gray-600 bg-gray-700/50 text-gray-300 hover:border-blue-500"
            : "border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-500"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <MdCloudUpload className="text-3xl text-blue-500" />
        <span className="text-sm font-medium">Click or drop prescription images here</span>
        <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          JPG, PNG, WEBP, GIF, HEIC · up to {PRESCRIPTION_MAX_SIZE_MB}MB each · max {PRESCRIPTION_MAX_FILES} at a time
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // allow picking the same file again
        }}
      />

      {(saved.length > 0 || pending.length > 0) && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Already saved on the customer */}
          {saved.map((item, index) => (
            <div key={`saved-${item.url}`} className={tileClass}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" title="Open full size">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbUrl || item.url}
                  alt={item.fileName || "Prescription"}
                  className="w-full h-28 object-cover"
                />
              </a>
              <div className={`px-2 py-1 text-xs truncate ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {item.fileName || "Prescription"}
              </div>
              {onRemoveSaved && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemoveSaved(index)}
                  className={removeButtonClass}
                  title="Remove"
                >
                  <MdClose />
                </button>
              )}
            </div>
          ))}

          {/* Chosen, uploaded on save */}
          {pending.map((file, index) => (
            <div key={`pending-${file.name}-${file.lastModified}-${index}`} className={tileClass}>
              {previews[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[index]!} alt={file.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center">
                  {canPreview(file) ? (
                    <MdImage className="text-4xl text-gray-400" />
                  ) : (
                    <MdDescription className="text-4xl text-gray-400" />
                  )}
                </div>
              )}
              <div className={`px-2 py-1 text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <div className="truncate">{file.name}</div>
                <div className="text-[10px] text-amber-500">Not saved yet · {formatSize(file.size)}</div>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPendingChange(pending.filter((_, i) => i !== index))}
                className={removeButtonClass}
                title="Remove"
              >
                <MdClose />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
