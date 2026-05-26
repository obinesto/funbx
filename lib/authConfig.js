import { cookies } from "next/headers";
import { auth } from "./firebase/firebaseAdmin";

export const SESSION_COOKIE_NAME = "session";

export async function verifyAuthToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Invalid token");
  }
}

export async function validateRequest(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return await verifyAuthToken(authHeader);
    }

    return await getCurrentUser();
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    return await auth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    return null;
  }
}
