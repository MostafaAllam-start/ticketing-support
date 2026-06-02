"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImageDropzoneTexts = {
  hint: string; // primary prompt, e.g. "Drag & drop or click to browse"
  types: string; // accepted types / size, e.g. "PNG, JPG · up to 5 MB"
  remove: string; // remove-button aria-label
};

// A drag-and-drop / click-to-browse image picker that submits the chosen file as
// part of a normal <form> (via a hidden <input type="file" name={name}>), so it
// works with Server Actions without any client-side upload plumbing. `defaultPreview`
// shows the existing image in edit mode; removing a freshly picked file reverts to it.
export function ImageDropzone({
  id,
  name,
  defaultPreview,
  texts,
  invalid,
  className,
}: {
  id?: string;
  name: string;
  defaultPreview?: string;
  texts: ImageDropzoneTexts;
  invalid?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // What to show: a freshly picked file's preview wins over the existing image.
  const preview = objectUrl ?? defaultPreview;

  function selectFile(file: File | null) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(file ? URL.createObjectURL(file) : null);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    // Reflect the dropped file into the hidden <input> so it submits with the form.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    selectFile(file);
  }

  function clear() {
    selectFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
      />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via onKeyDown below */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-transparent p-4 text-center transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging && "border-ring bg-accent/40",
          invalid && "border-destructive",
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="size-20 rounded-md object-cover"
            />
            {objectUrl && (
              <button
                type="button"
                aria-label={texts.remove}
                onClick={(event) => {
                  event.stopPropagation();
                  clear();
                }}
                className="absolute end-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </>
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <div className="space-y-0.5">
          <p className="text-sm">{texts.hint}</p>
          <p className="text-xs text-muted-foreground">{texts.types}</p>
        </div>
      </div>
    </div>
  );
}

type Preview = { file: File; url: string };

// Like ImageDropzone, but accepts MANY images. The selected files are kept in
// sync with a hidden <input type="file" multiple name={name}> (via a
// DataTransfer) so they submit with a normal form / Server Action under `name`.
export function MultiImageDropzone({
  name = "images",
  maxFiles = 8,
  texts,
  invalid,
  className,
}: {
  name?: string;
  maxFiles?: number;
  texts: ImageDropzoneTexts;
  invalid?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Preview[]>([]);
  const [dragging, setDragging] = useState(false);

  // Revoke object URLs on unmount (e.g. when the dialog closes).
  const itemsRef = useRef<Preview[]>([]);
  itemsRef.current = items;
  useEffect(
    () => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)),
    [],
  );

  function sync(next: Preview[]) {
    const transfer = new DataTransfer();
    next.forEach((it) => transfer.items.add(it.file));
    if (inputRef.current) inputRef.current.files = transfer.files;
    setItems(next);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (incoming.length === 0) return;

    const next = [...items];
    for (const file of incoming) {
      if (next.length >= maxFiles) break;
      next.push({ file, url: URL.createObjectURL(file) });
    }
    sync(next);
  }

  function removeAt(index: number) {
    const target = items[index];
    if (target) URL.revokeObjectURL(target.url);
    sync(items.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via onKeyDown below */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-transparent p-4 text-center transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging && "border-ring bg-accent/40",
          invalid && "border-destructive",
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="text-sm">{texts.hint}</p>
          <p className="text-xs text-muted-foreground">{texts.types}</p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.url}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              {/* Blob preview — must use a plain img; next/image rejects blob: URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={texts.remove}
                onClick={() => removeAt(index)}
                className="absolute end-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-0"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
