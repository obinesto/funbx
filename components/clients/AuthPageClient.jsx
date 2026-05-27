"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import authStore from "@/store/authStore";
import BrandLogo from "@/components/global/BrandLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const getSafeNextPath = (nextPath) => {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
};

export default function Auth() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    error,
    isAuthenticated,
    sessionSynced,
    refreshSession,
    clearError: clearStoreError,
  } = authStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));

  useEffect(() => {
    let isMounted = true;

    const finishAuthenticatedRedirect = async () => {
      if (!isAuthenticated) {
        return;
      }

      if (sessionSynced || !navigator.onLine) {
        router.replace(nextPath);
        return;
      }

      try {
        const didSync = await refreshSession();
        if (isMounted && didSync) {
          router.replace(nextPath);
        }
      } catch (error) {
        setErrorMessage(
          error.message || "Unable to finish sign in. Please try again.",
        );
      }
    };

    finishAuthenticatedRedirect();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, nextPath, refreshSession, router, sessionSynced]);

  const clearError = useCallback(() => {
    const timer = setTimeout(() => {
      setErrorMessage("");
      clearStoreError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [clearStoreError]);

  useEffect(() => {
    if (errorMessage || error) {
      clearError();
    }
  }, [errorMessage, error, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoader(true);
    setErrorMessage("");

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setSubmitLoader(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(formData);
      } else {
        await loginWithEmail(formData.email, formData.password);
      }

      router.replace(nextPath);
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed");
    } finally {
      setSubmitLoader(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitLoader(true);
    setErrorMessage("");
    try {
      const didLogin = await loginWithGoogle();
      if (didLogin === false) {
        throw new Error(error || "Authentication failed");
      }
      router.replace(nextPath);
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed");
    } finally {
      setSubmitLoader(false);
    }
  };

  if (isAuthenticated && !errorMessage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-customRed" />
          <p className="text-sm text-muted-foreground">
            {sessionSynced || !navigator.onLine
              ? "Taking you back to your page..."
              : "Finishing sign in..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center py-4">
          <BrandLogo size="md" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isSignUp ? "Create an account" : "Sign in to your account"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Enter your details below to create your account"
                : "Enter your email below to login to your account"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {(errorMessage || error) && (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {errorMessage || error}
                  </AlertDescription>
                </Alert>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required={isSignUp}
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="JohnDoe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Link
                      href="/auth/reset-password"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required={isSignUp}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        handleChange(e);
                        handlePasswordChange();
                      }}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-customRed hover:bg-customRed/90"
                disabled={submitLoader}
              >
                {submitLoader ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={submitLoader}
              >
                Continue with Google
              </Button>
            </CardContent>
          </form>

          <CardFooter>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  username: "",
                });
                setErrorMessage("");
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
