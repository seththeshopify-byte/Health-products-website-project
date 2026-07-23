import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, Video, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CLOUDINARY_CLOUD_NAME = "djzigoye";
const CLOUDINARY_UPLOAD_PRESET = "ruth_health_products";

type MediaKind = "image" | "video";

async function uploadToCloudinary(file: File, kind: MediaKind): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${kind}/upload`,
    { method: "POST", body: formData },
  );
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error("Upload failed");
  }
  return result.secure_url as string;
}

export function MediaUploader({
  imageUrls,
  videoUrls,
  onImagesChange,
  onVideosChange,
}: {
  imageUrls: string[];
  videoUrls: string[];
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<MediaKind | null>(null);
  const [uploading, setUploading] = useState<MediaKind | null>(null);
  const { toast } = useToast();

  const addFiles = async (files: FileList | File[], kind: MediaKind) => {
    const selected = Array.from(files).filter((file) =>
      kind === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/"),
    );
    if (!selected.length) {
      toast({ title: `Please choose ${kind} files`, variant: "destructive" });
      return;
    }
    if (selected.some((file) => file.size > 100 * 1024 * 1024)) {
      toast({ title: "Each video must be under 100 MB", variant: "destructive" });
      return;
    }
    setUploading(kind);
    try {
      const uploaded = [];
      for (const file of selected) {
        uploaded.push(await uploadToCloudinary(file, kind));
      }
      if (kind === "image") onImagesChange([...imageUrls, ...uploaded]);
      else onVideosChange([...videoUrls, ...uploaded]);
      toast({ title: `${uploaded.length} ${kind}${uploaded.length === 1 ? "" : "s"} uploaded` });
    } catch {
      toast({ title: `${kind} upload failed`, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (pastedImages.length) {
      event.preventDefault();
      void addFiles(pastedImages, "image");
    }
  };

  const drop = (event: React.DragEvent<HTMLDivElement>, kind: MediaKind) => {
    event.preventDefault();
    setDragging(null);
    void addFiles(event.dataTransfer.files, kind);
  };

  return (
    <div className="grid gap-5" onPaste={handlePaste}>
      <MediaDropZone
        kind="image"
        inputRef={imageInputRef}
        dragging={dragging === "image"}
        uploading={uploading === "image"}
        onDragStart={() => setDragging("image")}
        onDragEnd={() => setDragging(null)}
        onDrop={(event) => drop(event, "image")}
        onBrowse={() => imageInputRef.current?.click()}
        onFiles={(files) => void addFiles(files, "image")}
      />
      <MediaPreviewGrid
        kind="image"
        urls={imageUrls}
        onRemove={(index) => onImagesChange(imageUrls.filter((_, item) => item !== index))}
      />

      <MediaDropZone
        kind="video"
        inputRef={videoInputRef}
        dragging={dragging === "video"}
        uploading={uploading === "video"}
        onDragStart={() => setDragging("video")}
        onDragEnd={() => setDragging(null)}
        onDrop={(event) => drop(event, "video")}
        onBrowse={() => videoInputRef.current?.click()}
        onFiles={(files) => void addFiles(files, "video")}
      />
      <MediaPreviewGrid
        kind="video"
        urls={videoUrls}
        onRemove={(index) => onVideosChange(videoUrls.filter((_, item) => item !== index))}
      />
      <p className="text-xs text-muted-foreground">
        You can add as many photos and videos as you need. Click inside this area and press Ctrl+V or Cmd+V to paste a copied image.
      </p>
    </div>
  );
}

function MediaDropZone({
  kind,
  inputRef,
  dragging,
  uploading,
  onDragStart,
  onDragEnd,
  onDrop,
  onBrowse,
  onFiles,
}: {
  kind: MediaKind;
  inputRef: React.RefObject<HTMLInputElement | null>;
  dragging: boolean;
  uploading: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onBrowse: () => void;
  onFiles: (files: FileList) => void;
}) {
  const Icon = kind === "image" ? ImagePlus : Video;
  return (
    <div
      tabIndex={0}
      onDragOver={(event) => {
        event.preventDefault();
        onDragStart();
      }}
      onDragLeave={onDragEnd}
      onDrop={onDrop}
      onClick={onBrowse}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
        dragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={kind === "image" ? "image/*" : "video/*"}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Loader2 size={18} className="animate-spin" /> Uploading {kind}s…
        </div>
      ) : (
        <>
          <Icon size={26} className="mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">
            Drag and drop {kind}s here, or click to browse
          </p>
          {kind === "image" && <p className="mt-1 text-xs text-muted-foreground">You can also paste copied images here</p>}
        </>
      )}
    </div>
  );
}

function MediaPreviewGrid({
  kind,
  urls,
  onRemove,
}: {
  kind: MediaKind;
  urls: string[];
  onRemove: (index: number) => void;
}) {
  if (!urls.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {urls.map((url, index) => (
        <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-lg border bg-muted">
          {kind === "image" ? (
            <img src={url} alt={`Uploaded ${kind} ${index + 1}`} className="aspect-square h-full w-full object-cover" />
          ) : (
            <video src={url} controls preload="metadata" className="aspect-video h-full w-full object-contain bg-black" />
          )}
          <button
            type="button"
            aria-label={`Remove ${kind} ${index + 1}`}
            onClick={() => onRemove(index)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/75 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}