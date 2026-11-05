import authStore from "@/store/authStore";

// Read Firebase credentials at request time instead of using a render's token.
export async function fetchWithAuth(url, options = {}, expectedEmail) {
  const email = expectedEmail || authStore.getState().user?.email;
  const send = async (forceRefresh) => {
    options.signal?.throwIfAborted();
    const token = await authStore.getState().getFreshToken(forceRefresh, email);
    options.signal?.throwIfAborted();
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };

  let response = await send(false);
  if (response.status === 401) {
    response = await send(true);
    if (response.status === 401 && authStore.getState().user?.email === email) {
      await authStore.getState().expireSession();
      throw new Error("Your session has expired. Please sign in again.");
    }
  }
  return response;
}

export async function ensureServerSession(expectedEmail) {
  if (!(await authStore.getState().refreshSession(expectedEmail))) {
    throw new Error("Your session has expired. Please sign in again.");
  }
}
