"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import authStore from "@/store/authStore";
import BrandLogo from "@/components/global/BrandLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { requestPasswordResetOtp, confirmPasswordResetOtp } = authStore();
  const router = useRouter();

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoader(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!codeSent) {
        const message = await requestPasswordResetOtp(email);
        setSuccessMessage(message);
        setCodeSent(true);
        return;
      }

      if (!/^\d{6}$/.test(code)) {
        setErrorMessage("Enter the 6-digit code from your email");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }

      const message = await confirmPasswordResetOtp({
        email,
        code,
        password,
      });
      setSuccessMessage(
        message || "Password updated. You can now sign in."
      );
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message || "Failed to send reset email");
      setSuccessMessage("");
    } finally {
      setSubmitLoader(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center py-4">
          <BrandLogo size="md" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset your password
            </CardTitle>
            <CardDescription>
              {codeSent
                ? "Enter the 6-digit code from your email and choose a new password."
                : "Enter your email address and we'll send you a 6-digit reset code."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <AlertDescription className="flex items-center gap-2">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="john@example.com"
                    disabled={codeSent}
                  />
                </div>
              </div>

              {codeSent && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Reset Code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-customRed hover:bg-customRed/90"
                disabled={submitLoader}
              >
                {submitLoader ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {codeSent ? "Resetting password..." : "Sending code..."}
                  </span>
                ) : (
                  codeSent ? "Reset password" : "Send reset code"
                )}
              </Button>

              {codeSent && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={submitLoader}
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setPassword("");
                    setConfirmPassword("");
                    setSuccessMessage("");
                  }}
                >
                  Use a different email
                </Button>
              )}
            </CardContent>
          </form>

          <CardFooter>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => router.push("/auth")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
