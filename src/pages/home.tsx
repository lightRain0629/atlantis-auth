import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, ListChecks, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();
  const features = [
    {
      icon: ShieldCheck,
      title: t("home.features.authTitle"),
      description: t("home.features.authDesc"),
    },
    {
      icon: ListChecks,
      title: t("home.features.todosTitle"),
      description: t("home.features.todosDesc"),
    },
    {
      icon: Users,
      title: t("home.features.adminTitle"),
      description: t("home.features.adminDesc"),
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="rounded-full bg-slate-900 text-white inline-flex px-4 py-1 text-xs uppercase tracking-wide">
            {t("home.badge")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t("home.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">{t("home.ctaLogin")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/register">{t("home.ctaRegister")}</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((item) => (
            <Card key={item.title} className="border-border/70">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-900 text-white grid place-items-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
      <Card className="self-start border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle>{t("home.quickLinksTitle")}</CardTitle>
          <CardDescription>{t("home.quickLinksDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            to="/register"
          >
            {t("home.quickLinks.register")}
          </Link>
          <Link
            className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            to="/login"
          >
            {t("home.quickLinks.login")}
          </Link>
          <Link
            className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            to="/todos"
          >
            {t("home.quickLinks.todos")}
          </Link>
          <Link
            className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            to="/sessions"
          >
            {t("home.quickLinks.sessions")}
          </Link>
          <Link
            className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            to="/users"
          >
            {t("home.quickLinks.users")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
