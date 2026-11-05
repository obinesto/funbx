import { create } from "zustand";
import {
  signInWithPopup,
  signOut,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import {
  findUserByEmail,
  createUser,
  updateUserFirebaseUid,
} from "@/lib/database/users";

const provider = new GoogleAuthProvider();
const SESSION_ERROR_CODES = [
  "auth/user-token-expired",
  "auth/invalid-user-token",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/invalid-refresh-token",
];

const isBrowserOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

async function syncSessionCookie(token, { required = false } = {}) {
  if (!token) return false;

  if (isBrowserOffline()) {
    if (required) {
      throw new Error("Network error. Check your connection and try again");
    }
    return false;
  }

  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      const error = new Error("Unable to renew your session. Please try again.");
      error.status = response.status;
      throw error;
    }

    return true;
  } catch (error) {
    if (required) {
      throw error;
    }
    console.warn("Session cookie sync skipped:", error);
    return false;
  }
}

async function clearSessionCookie() {
  if (isBrowserOffline()) {
    return;
  }

  await fetch("/api/session", {
    method: "DELETE",
  }).catch(() => { });
}

const authStore = create((set) => ({
  user: null,
  token: null,
  sessionSynced: false,
  loading: true,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    try {
      await signOut(auth);
      await clearSessionCookie();
      set({
        user: null,
        token: null,
        sessionSynced: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  loginWithGoogle: async () => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const result = await signInWithPopup(auth, provider);
      if (!result.user) {
        throw new Error("No user data returned from Google sign-in");
      }

      try {
        // Check if user exists in Supabase
        const supabaseUser = await findUserByEmail(result.user.email);

        if (!supabaseUser) {
          // If user doesn't exist, create a new user
          await createUser({
            email: result.user.email,
            username: result.user.displayName,
            firebaseUid: result.user.uid,
          });
        } else if (!supabaseUser.firebase_uid) {
          // If user exists but doesn't have firebase_uid, update it
          await updateUserFirebaseUid(result.user.email, result.user.uid);
        }

        const token = await result.user.getIdToken();
        const sessionSynced = await syncSessionCookie(token, {
          required: true,
        });
        set({
          user: result.user,
          token,
          sessionSynced,
          error: null,
          isAuthenticated: true,
        });
        return true;
      } catch (error) {
        console.error("Database operation failed:", error);
        // Sign the user out if there is no sync between firebase and database
        await signOut(auth);
        throw new Error("Failed to create user profile. Please try again.");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      set({
        user: null,
        token: null,
        sessionSynced: false,
        error: error.message,
        isAuthenticated: false,
      });
      return false;
    }
  },

  signUpWithEmail: async (formData) => {
    const { email, password, username } = formData;
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new Error("Email address already in use");
      }
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create Supabase user record
      await createUser({
        email,
        username,
        firebaseUid: result.user.uid,
      });

      // Update Firebase profile with username
      if (username) {
        await updateProfile(result.user, {
          displayName: username,
        });
      }

      await signOut(auth);
      await clearSessionCookie();

      set({
        user: null,
        token: null,
        sessionSynced: false,
        error: null,
        isAuthenticated: false,
        loading: false,
      });

      return true;
    } catch (error) {
      if (
        !String(error.code || "").startsWith("auth/") &&
        (typeof error.status === "number"
          ? error.status >= 500
          : /database connection|failed to connect|service unavailable|temporarily unavailable/i.test(
            error.message || "",
          ))
      ) {
        const serviceMessage =
          "Service temporarily unavailable. Please try again in a moment.";
        set({ error: serviceMessage });
        throw new Error(serviceMessage);
      }
      let errorMessage = error.message;
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email address already in use";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      }
      set({ error: errorMessage });
      throw error;
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const user = await findUserByEmail(email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // If user exists but doesn't have firebase_uid, update it
      if (!user.firebase_uid) {
        await updateUserFirebaseUid(email, result.user.uid);
      }

      const token = await result.user.getIdToken();
      const sessionSynced = await syncSessionCookie(token, { required: true });
      set({
        user: result.user,
        token,
        sessionSynced,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      const isServiceError =
        !String(error.code || "").startsWith("auth/") &&
        (typeof error.status === "number"
          ? error.status >= 500
          : /database connection|failed to connect|service unavailable|temporarily unavailable/i.test(
            error.message || "",
          ));

      if (isServiceError) {
        const serviceMessage =
          "Service temporarily unavailable. Please try again later.";
        set({ error: serviceMessage });
        throw new Error(serviceMessage);
      }

      let errorMessage = "Invalid email or password";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Enter a valid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Check your connection and try again";
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  requestPasswordResetOtp: async (email) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reset code");
      }

      set({ error: null });
      return data.message;
    } catch (error) {
      const errorMessage =
        error.message || "Unable to send reset code. Please try again later";

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  confirmPasswordResetOtp: async ({ email, code, password }) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to reset password");
      }

      set({ error: null });
      return data.message;
    } catch (error) {
      const errorMessage =
        error.message || "Unable to reset password. Please try again later";

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const currentUser = auth.currentUser;

      if (!currentUser?.email) {
        throw new Error("Sign in again before changing your password");
      }

      if (!currentPassword || !newPassword) {
        throw new Error("Current password and new password are required");
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      const token = await currentUser.getIdToken(true);
      const sessionSynced = await syncSessionCookie(token, { required: true });

      set({
        user: currentUser,
        token,
        sessionSynced,
        error: null,
        isAuthenticated: true,
      });

      return "Password updated successfully.";
    } catch (error) {
      let errorMessage =
        error.message || "Unable to update password. Please try again later";

      if (error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Sign in again before changing your password";
      } else if (error.code === "auth/provider-already-linked") {
        errorMessage = "This account is managed by a sign-in provider";
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteAccount: async ({ currentPassword } = {}) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const currentUser = auth.currentUser;

      if (!currentUser?.email) {
        throw new Error("Sign in again before deleting your account");
      }

      const usesPasswordProvider = currentUser.providerData.some(
        (accountProvider) => accountProvider.providerId === "password",
      );
      const usesGoogleProvider = currentUser.providerData.some(
        (accountProvider) => accountProvider.providerId === "google.com",
      );

      if (usesPasswordProvider) {
        if (!currentPassword) {
          throw new Error("Current password is required");
        }

        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword,
        );
        await reauthenticateWithCredential(currentUser, credential);
      } else if (usesGoogleProvider) {
        await reauthenticateWithPopup(currentUser, provider);
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete account data");
      }

      await deleteUser(currentUser);
      await clearSessionCookie();

      set({
        user: null,
        token: null,
        sessionSynced: false,
        isAuthenticated: false,
        error: null,
      });

      return "Your account has been deleted.";
    } catch (error) {
      let errorMessage =
        error.message || "Unable to delete account. Please try again later";

      if (error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google confirmation was cancelled";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Sign in again before deleting your account";
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  expireSession: async () => {
    const currentUser = auth.currentUser;
    const message = "Your session has expired. Please sign in again.";
    set({
      user: null,
      token: null,
      sessionSynced: false,
      loading: false,
      isAuthenticated: false,
      error: message,
    });
    await signOut(auth).catch(() => { });
    // Do not clear a different account that signed in while sign-out completed.
    if (auth.currentUser && auth.currentUser !== currentUser) return;
    await clearSessionCookie();
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      if (window.location.pathname !== "/auth") {
        window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
      }
    }
  },

  getFreshToken: async (forceRefresh = false, expectedEmail) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      await authStore.getState().expireSession();
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (expectedEmail && currentUser.email !== expectedEmail) {
      throw new Error("Your account changed. Please try again.");
    }
    try {
      // Firebase refreshes expired or nearly expired tokens here.
      const token = await currentUser.getIdToken(forceRefresh);
      if (auth.currentUser !== currentUser) {
        throw new Error("Your account changed. Please try again.");
      }
      set({ user: currentUser, token, isAuthenticated: true });
      return token;
    } catch (error) {
      if (
        SESSION_ERROR_CODES.includes(error.code) &&
        (!auth.currentUser || auth.currentUser === currentUser)
      ) {
        await authStore.getState().expireSession();
      }
      throw error;
    }
  },

  refreshSession: async (expectedEmail) => {
    if (!auth.currentUser) {
      await authStore.getState().expireSession();
      return false;
    }
    const currentUser = auth.currentUser;
    let token = await authStore.getState().getFreshToken(false, expectedEmail || currentUser.email);
    try {
      await syncSessionCookie(token, { required: true });
    } catch (error) {
      if (error.status !== 401) throw error;
      token = await authStore.getState().getFreshToken(true, expectedEmail || currentUser.email);
      try {
        await syncSessionCookie(token, { required: true });
      } catch (retryError) {
        if (retryError.status === 401 && auth.currentUser === currentUser) {
          await authStore.getState().expireSession();
        }
        throw retryError;
      }
    }
    if (auth.currentUser !== currentUser) {
      throw new Error("Your account changed. Please try again.");
    }
    set({
      user: currentUser,
      token,
      sessionSynced: true,
      loading: false,
      isAuthenticated: true,
      error: null,
    });
    return true;
  },

  clearError: () => set({ error: null }),
}));

// auth state listener
onIdTokenChanged(auth, async (currentUser) => {
  if (currentUser) {
    if (isBrowserOffline()) {
      authStore.setState((state) => ({
        user: currentUser,
        token: state.token || currentUser.accessToken || null,
        sessionSynced: state.sessionSynced,
        loading: false,
        isAuthenticated: true,
        error: null,
      }));
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const sessionSynced = await syncSessionCookie(token);
      // If getIdToken() succeeds, Firebase has handled token refresh if needed.
      // The token is valid.
      if (token && auth.currentUser === currentUser) {
        authStore.setState({
          user: currentUser,
          token,
          sessionSynced,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (error) {
      if (auth.currentUser !== currentUser) return;
      console.error("Unable to refresh authentication:", error);
      if (SESSION_ERROR_CODES.includes(error.code)) {
        await authStore.getState().expireSession();
      } else {
        // A network failure must not invalidate a recoverable Firebase session.
        authStore.setState({
          loading: false,
          sessionSynced: false,
          error: "Unable to check your session. Check your connection and try again.",
        });
      }
    }
  } else {
    if (isBrowserOffline()) {
      authStore.setState((state) => ({
        user: state.user,
        token: state.token,
        sessionSynced: state.sessionSynced,
        loading: false,
        isAuthenticated: Boolean(state.user),
        error: null,
      }));
      return;
    }

    await clearSessionCookie();
    authStore.setState({
      user: null,
      token: null,
      sessionSynced: false,
      loading: false,
      isAuthenticated: false,
      error: null,
    });
  }
});

if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const sessionSynced = await syncSessionCookie(token);
      if (auth.currentUser !== currentUser) return;
      authStore.setState({
        user: currentUser,
        token,
        sessionSynced,
        loading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      console.warn("Failed to refresh session after reconnect:", error);
    }
  });
}

export default authStore;
