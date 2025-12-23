import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResendOtpMutation, useVerifyEmailMutation } from "@/services/api";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

type FormValues = z.infer<typeof schema>;

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [verify, { isLoading }] = useVerifyEmailMutation();
  const [resend, { isLoading: isResending }] = useResendOtpMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setValue("email", emailParam);
  }, [params, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await verify(values).unwrap();
      toast.success(t("verifyEmail.success"));
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("verifyEmail.error"));
    }
  };

  const handleResend = async () => {
    try {
      const email = params.get("email") || "";
      await resend({ email: email || "" }).unwrap();
      toast.info(t("verifyEmail.resendInfo"));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("verifyEmail.resendError"));
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">{t("verifyEmail.title")}</CardTitle>
          <CardDescription>{t("verifyEmail.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{t("verifyEmail.labelCode", { defaultValue: "OTP code" })}</Label>
              <Input id="code" placeholder="123456" maxLength={6} {...register("code")} />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("verifyEmail.button")}
            </Button>
          </form>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("verifyEmail.resendPrompt")}</span>
            <Button variant="ghost" onClick={handleResend} disabled={isResending}>
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("verifyEmail.resend")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
