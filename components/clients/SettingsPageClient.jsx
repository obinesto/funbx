"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import authStore from "@/store/authStore";
import { useTheme } from "@/providers/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import LoadingProtected from "@/components/global/LoadingProtected";
import ChangePasswordDialog from "@/components/global/ChangePasswordDialog";
import DeleteAccountDialog from "@/components/global/DeleteAccountDialog";

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

export default function SettingsPageClient() {
  const { user, loading, logout } = authStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/settings");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <LoadingProtected />;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const initial = displayName[0]?.toUpperCase() || "F";
  const usesPasswordProvider = user?.providerData?.some(
    (provider) => provider.providerId === "password",
  );

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out.");
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
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={displayName}
              />
              <AvatarFallback className="text-lg">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold">{displayName}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">Signed in</Badge>
                {user?.emailVerified ? (
                  <Badge variant="secondary">Email verified</Badge>
                ) : (
                  <Badge variant="outline">Email not verified</Badge>
                )}
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
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border bg-background/70 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-customRed" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      {usesPasswordProvider
                        ? "Change your account password after confirming your current one."
                        : "This account signs in with a provider. Manage its password with that provider."}
                    </p>
                  </div>
                </div>
                {usesPasswordProvider && (
                  <ChangePasswordDialog disabled={!usesPasswordProvider} />
                )}
              </div>
            </div>
            <SettingsAction
              icon={Mail}
              title="Email address"
              description={user.email}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Preferences and Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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

      <Card className="border-destructive/30 shadow-sm shadow-black/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Delete account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your FunBx account and account-owned data.
            </p>
          </div>
          <DeleteAccountDialog
            requiresPassword={usesPasswordProvider}
            userEmail={user.email}
          />
        </CardContent>
      </Card>

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
    </section>
  );
}
