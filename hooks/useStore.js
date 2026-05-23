import { create } from "zustand";
import {
  signInWithPopup,
  signOut,
  // onAuthStateChanged,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  findUserByEmail,
  createUser,
  updateUserFirebaseUid,
} from "../lib/database/users";

const provider = new GoogleAuthProvider();

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
      throw new Error("Failed to sync session cookie");
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
  }).catch(() => {});
}

const useUserStore = create((set) => ({
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

  resetPassword: async (email) => {
    try {
      if (isBrowserOffline()) {
        throw new Error("Network error. Check your connection and try again");
      }

      const user = await findUserByEmail(email);
      if (user) {
        await sendPasswordResetEmail(auth, email);
      }

      set({ error: null });
    } catch (error) {
      let errorMessage = "Unable to send reset email. Please try again later";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Enter a valid email address";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Check your connection and try again";
          break;
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  refreshSession: async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return false;
    }

    const token = await currentUser.getIdToken();
    const sessionSynced = await syncSessionCookie(token, { required: true });

    useUserStore.setState({
      user: currentUser,
      token,
      sessionSynced,
      loading: false,
      isAuthenticated: true,
      error: null,
    });

    return sessionSynced;
  },

  clearError: () => set({ error: null }),
}));

// auth state listener
onIdTokenChanged(auth, async (currentUser) => {
  if (currentUser) {
    if (isBrowserOffline()) {
      useUserStore.setState((state) => ({
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
      if (token) {
        useUserStore.setState({
          user: currentUser,
          token,
          sessionSynced,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (error) {
      // May happen if getIdToken() fails (e.g., network issue, token refresh fails, user disabled).
      // This indicates the session is no longer valid.
      console.error(
        "onAuthStateChanged: Error getting ID token or user session invalid.",
        error,
      );
      await signOut(auth);
      await clearSessionCookie();
      useUserStore.setState({
        user: null,
        token: null,
        sessionSynced: false,
        loading: false,
        isAuthenticated: false,
        error:
          "Your session has expired or could not be refreshed. Please log in again.",
      });
    }
  } else {
    if (isBrowserOffline()) {
      useUserStore.setState((state) => ({
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
    useUserStore.setState({
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
      useUserStore.setState({
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

export default useUserStore;
