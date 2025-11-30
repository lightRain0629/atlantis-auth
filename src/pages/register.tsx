import { useEffect } from "react";
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

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    passwordRepeat: z.string().min(6),
  })
  .refine((data) => data.password === data.passwordRepeat, {
    path: ["passwordRepeat"],
    message: "Passwords must match",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
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
      toast.success("Registered. Check your email for OTP.");
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      const message = err?.data?.message ?? "Failed to register";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            We will send a verification code to your email. Device ID is generated automatically per browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordRepeat">Repeat password</Label>
              <Input id="passwordRepeat" type="password" placeholder="••••••" {...register("passwordRepeat")} />
              {errors.passwordRepeat && <p className="text-sm text-red-500">{errors.passwordRepeat.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </form>
          <Button variant="ghost" className="px-0 text-primary" onClick={() => navigate("/login")}>
            Already have an account? Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
