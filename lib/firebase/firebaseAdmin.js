import admin from "firebase-admin";
import env from "@/lib/envConfig";

if (!admin.apps.length) {
  // Initialize Firebase Admin with service account
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.server.firebaseAdmin.projectId,
        clientEmail: env.server.firebaseAdmin.clientEmail,
        privateKey: env.server.firebaseAdmin.privateKey || undefined,
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export const auth = admin.auth();
