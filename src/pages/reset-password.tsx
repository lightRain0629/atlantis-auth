import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPasswordMutation } from "@/services/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const baseSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    passwordRepeat: z.string().min(6),
  });

type FormValues = z.infer<typeof baseSchema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      baseSchema.refine((data) => data.password === data.passwordRepeat, {
        message: t("resetPassword.passwordsMismatch"),
        path: ["passwordRepeat"],
      }),
    [t],
  );
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const tokenParam = params.get("token");
    if (tokenParam) setValue("token", tokenParam);
  }, [params, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await reset(values).unwrap();
      toast.success(t("resetPassword.success"));
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("resetPassword.error"));
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
          <CardDescription>{t("resetPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="token">{t("common.resetToken")}</Label>
              <Input id="token" placeholder={t("common.resetToken")} {...register("token")} />
              {errors.token && <p className="text-sm text-red-500">{errors.token.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.newPassword")}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordRepeat">{t("common.passwordRepeat")}</Label>
              <Input id="passwordRepeat" type="password" {...register("passwordRepeat")} />
              {errors.passwordRepeat && <p className="text-sm text-red-500">{errors.passwordRepeat.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("resetPassword.button")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
