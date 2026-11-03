/**
 * Mirrors the API's limits so a file that would be refused is caught before
 * it is uploaded. The server still checks everything, content included.
 */
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export const ATTACHMENT_EXTENSIONS = [
  "xlsx",
  "xls",
  "csv",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "txt",
] as const;

/** For the file input's `accept`, so the picker offers the right files. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(
  ",",
);

export type AttachmentProblem = "tooLarge" | "badType" | "emptyFile";

export function checkAttachment(file: File): AttachmentProblem | null {
  const dot = file.name.lastIndexOf(".");
  const ext = dot === -1 ? "" : file.name.slice(dot + 1).toLowerCase();
  if (!(ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)) {
    return "badType";
  }
  if (file.size === 0) return "emptyFile";
  if (file.size > ATTACHMENT_MAX_BYTES) return "tooLarge";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Hands a blob to the browser as a download under the given name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
