import { useEffect } from "react";
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

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    passwordRepeat: z.string().min(6),
  })
  .refine((data) => data.password === data.passwordRepeat, {
    message: "Passwords must match",
    path: ["passwordRepeat"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
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
      toast.success("Password changed. Please login.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reset password");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Use the token from your email to set a new password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="token">Reset token</Label>
              <Input id="token" placeholder="Reset token" {...register("token")} />
              {errors.token && <p className="text-sm text-red-500">{errors.token.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordRepeat">Repeat password</Label>
              <Input id="passwordRepeat" type="password" {...register("passwordRepeat")} />
              {errors.passwordRepeat && <p className="text-sm text-red-500">{errors.passwordRepeat.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
