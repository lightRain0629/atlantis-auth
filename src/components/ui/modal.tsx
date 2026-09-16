import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Freeze the page behind the overlay. Without this a phone scrolls the list
 * under the sheet the moment a finger lands outside the form.
 */
function useScrollLock() {
  React.useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    // Desktop keeps its scrollbar gutter so the page does not jump sideways.
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);
}

type ModalProps = {
  onClose: () => void;
  title: string;
  description?: string;
  /** Widths apply from `sm` up; a phone always gets the full-width sheet. */
  size?: "md" | "lg";
  children: React.ReactNode;
  className?: string;
};

/**
 * A bottom sheet on a phone, a centered dialog from `sm` up. The body scrolls
 * on its own so a long form can never push its buttons past the viewport.
 */
export function Modal({
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  const descriptionId = React.useId();

  useScrollLock();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  React.useEffect(() => {
    // Only when nothing inside asked for focus first (autoFocus on an input).
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl",
          size === "lg" ? "sm:max-w-lg" : "sm:max-w-md",
          className,
        )}
      >
        {/* Grab bar: the affordance that says "this sheet came from the bottom". */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div className="min-w-0">
            <h3 id={headingId} className="text-lg font-semibold leading-tight">
              {title}
            </h3>
            {description && (
              <p
                id={descriptionId}
                className="mt-0.5 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Pinned to the bottom of the scroll area, so Save stays reachable no matter
 * how long the form above it runs.
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-5 -mb-4 mt-5 flex flex-col-reverse gap-2 border-t bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] [&>button]:w-full sm:flex-row sm:justify-end sm:[&>button]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
