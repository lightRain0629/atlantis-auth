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
import { API_BASE_URL, type TokensResponse } from "@/services/api";
import { useAppDispatch } from "@/hooks";
import { setCredentials } from "@/features/auth/authSlice";

const providerMap: Record<string, "google" | "yandex"> = {
  google: "google",
  yandex: "yandex",
};

export default function OAuthBridgePage() {
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
        toast.error("Missing provider or token");
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
        toast.success("Signed in via OAuth");
        console.log("OAuth exchange successful", data);
        navigate("/todos", { replace: true });
      } catch (error: any) {
        console.error("OAuth exchange failed", error);
        setStatus("error");
        toast.error("Failed to finish OAuth login");
      }
    };
    exchange();
  }, [dispatch, navigate, providerKey, token]);

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
              <CardTitle>OAuth failed</CardTitle>
              <CardDescription>
                We could not complete the OAuth flow. Please try again.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={retry}>Back to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Finalizing OAuth session...</span>
    </div>
  );
}
