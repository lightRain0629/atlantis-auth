import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { toggleAmountsHidden } from "@/features/privacy/privacySlice";

const SHORTCUT_LABEL = "Shift+H";

/** True while focus sits somewhere a capital H is just a letter being typed. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Eye button that masks every money figure on the finance screens, for showing
 * the app to someone or using it in public. Shift+H flips it from anywhere on
 * the page except a text field.
 */
export default function AmountsVisibilityToggle() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const hidden = useAppSelector((s) => s.privacy.amountsHidden);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyH" ||
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat ||
        isTypingTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      dispatch(toggleAmountsHidden());
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

  const label = hidden ? t("finance.showAmounts") : t("finance.hideAmounts");

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="flex-shrink-0"
      onClick={() => dispatch(toggleAmountsHidden())}
      aria-label={label}
      aria-pressed={hidden}
      aria-keyshortcuts="Shift+H"
      title={`${label} (${SHORTCUT_LABEL})`}
    >
      {hidden ? (
        <EyeOff className="h-4 w-4" aria-hidden />
      ) : (
        <Eye className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}
