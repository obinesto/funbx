import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/firebaseAdmin";
import {
  generateOtp,
  normalizeEmail,
  sendPasswordResetOtpEmail,
  storePasswordResetOtp,
} from "@/lib/server/passwordResetOtp";

const genericMessage =
  "If an account exists for that email, a reset code will be sent shortly.";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    try {
      await auth.getUserByEmail(normalizedEmail);
    } catch (error) {
      return NextResponse.json({ message: genericMessage });
    }

    const code = generateOtp();
    await storePasswordResetOtp(normalizedEmail, code);
    await sendPasswordResetOtpEmail(normalizedEmail, code);

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Password reset OTP request failed:", error);
    return NextResponse.json(
      { error: "Unable to send reset code. Please try again later." },
      { status: 500 }
    );
  }
}
