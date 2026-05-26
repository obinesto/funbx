import "server-only";

import { getCurrentUser } from "@/lib/authConfig";
import { supabase } from "@/lib/supabaseConfig";

export async function getUserRecordByEmail(email, columns = "id, email") {
  if (!email) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select(columns)
    .eq("email", email)
    .single();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentUserRecord(columns = "id, email") {
  const sessionUser = await getCurrentUser();

  if (!sessionUser?.email) {
    return null;
  }

  const record = await getUserRecordByEmail(sessionUser.email, columns);

  return {
    auth: sessionUser,
    record,
  };
}

export async function requireCurrentUserRecord(columns = "id, email") {
  const context = await getCurrentUserRecord(columns);

  if (!context) {
    throw new Error("Unauthorized");
  }

  return context;
}
