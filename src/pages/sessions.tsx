import {
  useListSessionsQuery,
  useLogoutAllMutation,
  useLogoutCurrentMutation,
  useLogoutOthersMutation,
} from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Power, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function SessionsPage() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useListSessionsQuery();
  const [logoutOthers, { isLoading: loggingOutOthers }] =
    useLogoutOthersMutation();
  const [logoutAll, { isLoading: loggingOutAll }] = useLogoutAllMutation();
  const [logoutCurrent, { isLoading: loggingOutCurrent }] =
    useLogoutCurrentMutation();

  const revokeOthers = async () => {
    try {
      const res = await logoutOthers().unwrap();
      toast.success(t("sessions.revokedOthers", { count: res.revoked }));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("sessions.revokeError"));
    }
  };

  const revokeAll = async () => {
    try {
      const res = await logoutAll().unwrap();
      toast.success(t("sessions.revokedAll", { count: res.revoked }));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("sessions.revokeAllError"));
    }
  };

  const revokeCurrent = async () => {
    try {
      await logoutCurrent().unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{t("sessions.title")}</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh")}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={revokeOthers}
            disabled={loggingOutOthers}
          >
            {loggingOutOthers && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t("sessions.logoutOthers")}
          </Button>
          <Button
            variant="destructive"
            onClick={revokeAll}
            disabled={loggingOutAll}
          >
            {loggingOutAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("sessions.logoutAll")}
          </Button>
          <Button
            variant="outline"
            onClick={revokeCurrent}
            disabled={loggingOutCurrent}
          >
            {loggingOutCurrent && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Power className="h-4 w-4 mr-1" />
            {t("sessions.logoutCurrent")}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("sessions.listTitle")}</CardTitle>
          <CardDescription>{t("sessions.listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("sessions.loading")}</span>
            </div>
          )}
          {data?.sessions?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("sessions.none")}
            </p>
          )}
          {data?.sessions?.map((session) => (
            <div
              key={session.sessionId}
              className="flex flex-wrap items-start justify-between gap-2 py-3"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {session.device ?? "Unknown device"}{" "}
                  {session.isCurrent && (
                    <span className="text-xs text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded-full">
                      current
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.userAgent}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {session.ip ?? "—"} · DeviceId: {session.deviceId ?? "—"}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  {t("sessions.created")}:{" "}
                  {new Date(session.createdAt).toLocaleString()}
                </p>
                <p>
                  {t("sessions.expires")}:{" "}
                  {new Date(session.exp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
