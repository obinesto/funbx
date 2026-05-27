"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import authStore from "@/store/authStore";
import { useTheme } from "@/providers/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPageClient() {
  const { user, logout } = authStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const initial = displayName?.[0]?.toUpperCase() || "F";

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-customRed">
          Account
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your FunBx profile, security, and app preferences.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-16">
              <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="text-lg">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold">{displayName}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {user?.email || "Not signed in"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={user ? "secondary" : "outline"}>
                  {user ? "Signed in" : "Guest"}
                </Badge>
                {user?.emailVerified ? (
                  <Badge variant="secondary">Email verified</Badge>
                ) : user ? (
                  <Badge variant="outline">Email not verified</Badge>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-background/70 p-4">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-blue-400" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Dark mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark FunBx themes.
                  </p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingsAction
              icon={ShieldCheck}
              title="Reset password"
              description="Use a 6-digit email code to set a new password."
              href="/auth/reset-password"
            />
            <SettingsAction
              icon={Mail}
              title="Email address"
              description={user?.email || "Sign in to manage your email."}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Preferences and Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingsAction
              icon={User}
              title="Privacy policy"
              description="See how FunBx handles account and usage data."
              href="/privacy"
            />
            <SettingsAction
              icon={ShieldCheck}
              title="Terms of service"
              description="Review the rules for using FunBx."
              href="/terms"
            />
          </CardContent>
        </Card>
      </div>

      {user ? (
        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Leaving this device?</p>
              <p className="text-sm text-muted-foreground">
                Sign out to clear your local FunBx session.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function SettingsAction({ icon: Icon, title, description, href }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-background/70 p-4 transition-colors hover:bg-accent/60">
      <Icon className="h-5 w-5 text-customRed" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
