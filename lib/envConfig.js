// Central environment hub. Read every env value through here instead of
// touching process.env directly in app, lib, features, or utils code.
//
// Rules:
// - Only touch `env.public` and `env.runtime` from client components.
//   Never access `env.server` from client code (values are undefined there).

const readRaw = (name) => process.env[name];

const requireEnv = (name) => {
  const value = readRaw(name);
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getStringEnv = (name, fallback = "") => {
  const value = readRaw(name);
  return value === undefined || value === null ? fallback : value;
};

export const cleanHost = (value) => {
  if (!value) return "";
  const host = String(value)
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim();
  return host || "";
};

const env = {
  runtime: {
    get nodeEnv() {
      return getStringEnv("NODE_ENV", "development");
    },
    get isProduction() {
      return readRaw("NODE_ENV") === "production";
    },
    get isTest() {
      return readRaw("NODE_ENV") === "test";
    },
  },

  // Safe to use in client components.
  public: {
    get supabaseUrl() {
      return getStringEnv("NEXT_PUBLIC_SUPABASE_URL");
    },
    firebase: {
      get apiKey() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
      },
      get authDomain() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
      },
      get projectId() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
      },
      get storageBucket() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
      },
      get messagingSenderId() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
      },
      get appId() {
        return getStringEnv("NEXT_PUBLIC_FIREBASE_APP_ID");
      },
    },
    cloudinary: {
      get cloudName() {
        return getStringEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
      },
    },
    get vapidPublicKey() {
      return getStringEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    },
    // Relative /api calls work when empty, so this stays optional.
    get baseUrl() {
      return getStringEnv("NEXT_PUBLIC_BASE_URL");
    },
    // Bare hostname without protocol. Empty unless configured.
    get domainUrl() {
      return getStringEnv("NEXT_PUBLIC_DOMAIN_URL");
    },
    get domainHost() {
      return cleanHost(readRaw("NEXT_PUBLIC_DOMAIN_URL"));
    },
  },

  // Server only. Never import these in client components.
  server: {
    get supabaseServiceKey() {
      return getStringEnv("SUPABASE_SERVICE_ROLE_KEY");
    },
    firebaseAdmin: {
      get projectId() {
        return getStringEnv("FIREBASE_ADMIN_PROJECT_ID");
      },
      get clientEmail() {
        return getStringEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
      },
      get privateKey() {
        const raw = getStringEnv("FIREBASE_ADMIN_PRIVATE_KEY");
        return raw ? raw.replace(/\\n/g, "\n") : "";
      },
    },
    // Key rotation: at least one key must be set for YouTube features.
    get youtubeApiKeys() {
      return [
        readRaw("YOUTUBE_API_KEY"),
        readRaw("YOUTUBE_API_KEY2"),
        readRaw("YOUTUBE_API_KEY3"),
      ].filter(Boolean);
    },
    cloudinary: {
      get apiKey() {
        return getStringEnv("CLOUDINARY_API_KEY");
      },
      get apiSecret() {
        return getStringEnv("CLOUDINARY_API_SECRET");
      },
    },
    get gamepixSid() {
      return getStringEnv("GAMEPIX_SID", "1");
    },
    // Throws when accessed without a value. Callers already treat a
    // missing secret as a hard error at point of use.
    get passwordResetOtpSecret() {
      return requireEnv("PASSWORD_RESET_OTP_SECRET");
    },
    get resendApiKey() {
      return requireEnv("RESEND_API_KEY");
    },
    get authorEmail() {
      return getStringEnv("AUTHOR_EMAIL");
    },
    get vapidPrivateKey() {
      return getStringEnv("VAPID_PRIVATE_KEY");
    },
    get cronSecret() {
      return getStringEnv("CRON_SECRET");
    },
    // Vercel system values, used only as domain fallbacks.
    get vercelHost() {
      return (
        cleanHost(readRaw("VERCEL_PROJECT_PRODUCTION_URL")) ||
        cleanHost(readRaw("VERCEL_URL"))
      );
    },
  },
};

export default env;
