import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import env from "@/lib/envConfig";

// Next.js imports route modules during builds. Read credentials only on use.
export function getFirebaseAdminAuth() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: env.server.firebaseAdmin.projectId,
          clientEmail: env.server.firebaseAdmin.clientEmail,
          privateKey: env.server.firebaseAdmin.privateKey,
        }),
      });

  return getAuth(app);
}
