import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";
import type { TokensResponse } from "@/services/types";
import { useAppDispatch } from "@/hooks";
import { setCredentials } from "@/features/auth/authSlice";
import { useTranslation } from "react-i18next";

const providerMap: Record<string, "google" | "yandex"> = {
  google: "google",
  yandex: "yandex",
};

export default function OAuthBridgePage() {
  const { t } = useTranslation();
  const { provider } = useParams<{ provider: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const hasExchanged = useRef(false);
  const token = params.get("token");
  const providerKey = provider ? providerMap[provider] : undefined;

  useEffect(() => {
    const exchange = async () => {
      if (hasExchanged.current) return;
      hasExchanged.current = true;
      if (!token || !providerKey) {
        setStatus("error");
        toast.error(t("login.missingProvider"));
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/success-${providerKey}?token=${token}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`Backend responded ${res.status}`);
        }
        const data = (await res.json()) as TokensResponse;
        if (!data?.accessToken) {
          throw new Error("No tokens returned");
        }
        dispatch(setCredentials(data));
        toast.success(t("login.welcome"));
        navigate("/todos", { replace: true });
      } catch (error: any) {
        setStatus("error");
        toast.error(t("login.oauthFail"));
      }
    };
    exchange();
  }, [dispatch, navigate, providerKey, t, token]);

  const retry = () => {
    navigate("/login");
  };

  if (status === "error") {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-red-600" />
            <div>
              <CardTitle>{t("oauth.failedTitle")}</CardTitle>
              <CardDescription>{t("oauth.failedDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={retry}>{t("oauth.backToLogin")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{t("oauth.finalizing")}</span>
    </div>
  );
}
