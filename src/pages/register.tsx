import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegisterMutation } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const baseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  passwordRepeat: z.string().min(6),
});

type FormValues = z.infer<typeof baseSchema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      baseSchema.refine((data) => data.password === data.passwordRepeat, {
        path: ["passwordRepeat"],
        message: t("register.passwordsMismatch"),
      }),
    [t],
  );
  const navigate = useNavigate();
  const [registerUser, { isLoading, isSuccess }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isSuccess) {
      navigate("/verify-email");
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser(values).unwrap();
      toast.success(t("register.success"));
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      const message = err?.data?.message ?? t("register.error");
      toast.error(message);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input id="password" type="password" placeholder="••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordRepeat">{t("common.passwordRepeat")}</Label>
              <Input id="passwordRepeat" type="password" placeholder="••••••" {...register("passwordRepeat")} />
              {errors.passwordRepeat && <p className="text-sm text-red-500">{errors.passwordRepeat.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("register.button")}
            </Button>
          </form>
          <Button variant="ghost" className="px-0 text-primary" onClick={() => navigate("/login")}>
            {t("register.loginPrompt")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
