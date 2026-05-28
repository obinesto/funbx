"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import authStore from "@/store/authStore";
import BrandLogo from "@/components/global/BrandLogo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
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
  const { requestPasswordResetOtp, confirmPasswordResetOtp } = authStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoader(true);

    try {
      if (!codeSent) {
        const message = await requestPasswordResetOtp(email);
        toast.success(message);
        setCodeSent(true);
        return;
      }

      if (!/^\d{6}$/.test(code)) {
        toast.error("Enter the 6-digit code from your email");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const message = await confirmPasswordResetOtp({
        email,
        code,
        password,
      });
      toast.success(message || "Password updated. You can now sign in.");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
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
