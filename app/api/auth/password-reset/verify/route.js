import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/firebaseAdmin";
import {
  consumePasswordResetOtp,
  normalizeEmail,
  verifyPasswordResetOtp,
} from "@/lib/server/passwordResetOtp";

export async function POST(request) {
  try {
    const { email, code, password } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const verification = await verifyPasswordResetOtp(normalizedEmail, code);

    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.reason },
        { status: 400 }
      );
    }

    const user = await auth.getUserByEmail(normalizedEmail);
    await auth.updateUser(user.uid, { password });
    await consumePasswordResetOtp(normalizedEmail);

    return NextResponse.json({
      message: "Password updated. You can now sign in.",
    });
  } catch (error) {
    console.error("Password reset OTP verification failed:", error);
    return NextResponse.json(
      { error: "Unable to reset password. Please request a new code." },
      { status: 500 }
    );
  }
}
