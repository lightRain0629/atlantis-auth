import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useDeleteAttachmentMutation,
  useDownloadAttachmentMutation,
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
} from "@/services/api";
import type { AttachmentTarget, FinanceAttachment } from "@/services/types";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_EXTENSIONS,
  checkAttachment,
  formatBytes,
} from "@/lib/attachments";
import { formatDate } from "@/lib/finance-utils";

const errorMessage = (err: unknown) =>
  (err as { data?: { message?: string | string[] } })?.data?.message;

/**
 * Files kept with a record or a transfer — the statement it came from, the
 * monthly sales report. Lives inside the edit modals, so it only ever shows for
 * an entry that already exists; a new one has nothing to hang files off yet.
 */
export default function AttachmentsSection({
  target,
}: {
  target: AttachmentTarget;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: attachments = [], isLoading } = useGetAttachmentsQuery(target);
  const [upload, { isLoading: isUploading }] = useUploadAttachmentMutation();
  const [remove] = useDeleteAttachmentMutation();
  const [download] = useDownloadAttachmentMutation();

  const pick = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (inputRef.current) inputRef.current.value = "";

    for (const file of list) {
      const problem = checkAttachment(file);
      if (problem) {
        toast.error(
          t(`finance.attachments.${problem}`, {
            name: file.name,
            types: ATTACHMENT_EXTENSIONS.join(", "),
          }),
        );
        continue;
      }
      try {
        await upload({ target, file }).unwrap();
        toast.success(t("finance.attachments.uploaded", { name: file.name }));
      } catch (err) {
        const message = errorMessage(err);
        toast.error(
          (Array.isArray(message) ? message[0] : message) ??
            t("finance.attachments.uploadError"),
        );
      }
    }
  };

  const save = async (attachment: FinanceAttachment) => {
    setBusyId(attachment.id);
    try {
      await download(attachment).unwrap();
    } catch {
      toast.error(t("finance.attachments.downloadError"));
    } finally {
      setBusyId(null);
    }
  };

  const drop = async (attachment: FinanceAttachment) => {
    if (
      !window.confirm(
        t("finance.attachments.deleteConfirm", { name: attachment.originalName }),
      )
    ) {
      return;
    }
    setBusyId(attachment.id);
    try {
      await remove({ id: attachment.id, target }).unwrap();
      toast.info(t("finance.attachments.deleted"));
    } catch {
      toast.error(t("finance.attachments.deleteError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/70 px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          {t("finance.attachments.title")}
          {attachments.length > 0 && (
            <span className="text-muted-foreground">({attachments.length})</span>
          )}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading
            ? t("finance.attachments.uploading")
            : t("finance.attachments.add")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t("finance.loading")}</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("finance.attachments.empty")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5"
            >
              <FileText
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate" title={attachment.originalName}>
                  {attachment.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.sizeBytes)} ·{" "}
                  {formatDate(attachment.createdAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 flex-shrink-0 p-0 sm:h-8 sm:w-8"
                onClick={() => save(attachment)}
                disabled={busyId === attachment.id}
                aria-label={t("finance.attachments.download")}
              >
                {busyId === attachment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 flex-shrink-0 p-0 text-red-600 sm:h-8 sm:w-8"
                onClick={() => drop(attachment)}
                disabled={busyId === attachment.id}
                aria-label={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {t("finance.attachments.hint", {
          types: ATTACHMENT_EXTENSIONS.join(", "),
        })}
      </p>
    </div>
  );
}

/** The count on a timeline row; nothing at all when there are no files. */
export function AttachmentBadge({ count }: { count: number | undefined }) {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <span
      className="flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground"
      title={t("finance.attachments.count", { count })}
      aria-label={t("finance.attachments.count", { count })}
    >
      <Paperclip className="h-3 w-3" aria-hidden />
      {count}
    </span>
  );
}
