import { createHash, randomInt } from "crypto";
import { supabase } from "@/lib/supabaseConfig";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const memoryOtps = new Map();

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function getOtpSecret() {
  const otpSecret = process.env.PASSWORD_RESET_OTP_SECRET;

  if (!otpSecret)
    throw new Error("PASSWORD_RESET_OTP_SECRET is not configfured");
  return otpSecret;
}

export function hashOtp(email, code) {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${getOtpSecret()}`)
    .digest("hex");
}

export function getOtpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export async function storePasswordResetOtp(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const codeHash = hashOtp(normalizedEmail, code);
  const expiresAt = getOtpExpiry();

  if (!supabase) {
    memoryOtps.set(normalizedEmail, {
      code_hash: codeHash,
      attempts: 0,
      consumed_at: null,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });
    return;
  }

  await supabase
    .from("password_reset_otps")
    .delete()
    .eq("email", normalizedEmail);

  const { error } = await supabase.from("password_reset_otps").insert([
    {
      email: normalizedEmail,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    },
  ]);

  if (error) {
    throw error;
  }
}

async function getPasswordResetOtp(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!supabase) {
    return memoryOtps.get(normalizedEmail) || null;
  }

  const { data, error } = await supabase
    .from("password_reset_otps")
    .select("*")
    .eq("email", normalizedEmail)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function incrementAttempts(email, attempts) {
  const normalizedEmail = normalizeEmail(email);

  if (!supabase) {
    const record = memoryOtps.get(normalizedEmail);
    if (record) {
      memoryOtps.set(normalizedEmail, { ...record, attempts });
    }
    return;
  }

  await supabase
    .from("password_reset_otps")
    .update({ attempts })
    .eq("email", normalizedEmail)
    .is("consumed_at", null);
}

export async function consumePasswordResetOtp(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!supabase) {
    memoryOtps.delete(normalizedEmail);
    return;
  }

  await supabase
    .from("password_reset_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", normalizedEmail)
    .is("consumed_at", null);
}

export async function verifyPasswordResetOtp(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || "").trim();

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { ok: false, reason: "Enter the 6-digit code" };
  }

  const record = await getPasswordResetOtp(normalizedEmail);

  if (!record) {
    return { ok: false, reason: "Invalid or expired code" };
  }

  if (
    record.consumed_at ||
    new Date(record.expires_at).getTime() <= Date.now()
  ) {
    return { ok: false, reason: "Invalid or expired code" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "Too many attempts. Request a new code" };
  }

  const expectedHash = hashOtp(normalizedEmail, normalizedCode);

  if (record.code_hash !== expectedHash) {
    await incrementAttempts(normalizedEmail, record.attempts + 1);
    return { ok: false, reason: "Invalid or expired code" };
  }

  return { ok: true };
}

export async function sendPasswordResetOtpEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = "FunBx <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your FunBx password reset code",
      text: `Your FunBx password reset code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h1 style="color:#ff0000">FunBx password reset</h1>
          <p>Use this code to reset your password:</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</p>
          <p>This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send reset code: ${details}`);
  }
}
