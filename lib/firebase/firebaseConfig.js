import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import env from "@/lib/envConfig";

const firebaseConfig = {
  apiKey: env.public.firebase.apiKey,
  authDomain: env.public.firebase.authDomain,
  projectId: env.public.firebase.projectId,
  storageBucket: env.public.firebase.storageBucket,
  messagingSenderId: env.public.firebase.messagingSenderId,
  appId: env.public.firebase.appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
