import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import env from "@/lib/envConfig";

const app = getApps().length
  ? getApp()
  : initializeApp({
    credential: cert({
      projectId: env.server.firebaseAdmin.projectId,
      clientEmail: env.server.firebaseAdmin.clientEmail,
      privateKey: env.server.firebaseAdmin.privateKey,
    }),
  });

export const auth = getAuth(app);