import { Navigate, useLocation } from "react-router-dom";
import { useMeQuery } from "@/services/api";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Props = { children: ReactNode };

export function RequireAuth({ children }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMeQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("protected.checkingSession")}</span>
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMeQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("protected.checkingPermissions")}</span>
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!data.roles?.includes("ADMIN")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
