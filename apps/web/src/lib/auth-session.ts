const AUTH_TOKEN_KEY = "horus_access_token";
const AUTH_REFRESH_KEY = "horus_refresh_token";
const AUTH_USER_KEY = "horus_auth_user";
const DEMO_MODE_KEY = "horus_demo_mode";
const ONBOARDING_KEY = "horus_onboarding_completed";

export type StoredAuthUser = {
  id: string;
  email: string;
  name: string;
  avatarLabel?: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getClientAccessToken() {
  if (!isBrowser()) {
    return null;
  }

  const fromStorage = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (fromStorage) {
    return fromStorage;
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_TOKEN_KEY}=`));

  return cookieMatch ? decodeURIComponent(cookieMatch.split("=")[1] ?? "") : null;
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function storeAuthUser(user: StoredAuthUser | null) {
  if (!isBrowser()) {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function persistAuthSession(payload: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
  user?: StoredAuthUser | null;
}) {
  if (!isBrowser()) {
    return;
  }

  const maxAge = Number(payload.expiresIn ?? "3600");
  window.localStorage.setItem(AUTH_TOKEN_KEY, payload.accessToken);

  if (payload.refreshToken) {
    window.localStorage.setItem(AUTH_REFRESH_KEY, payload.refreshToken);
  }

  if (payload.user) {
    storeAuthUser(payload.user);
  }

  window.localStorage.removeItem(DEMO_MODE_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(payload.accessToken)}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${DEMO_MODE_KEY}=0; path=/; max-age=0; samesite=lax`;
}

export function persistDemoSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(DEMO_MODE_KEY, "1");
  document.cookie = `${DEMO_MODE_KEY}=1; path=/; max-age=2592000; samesite=lax`;
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(ONBOARDING_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${ONBOARDING_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function clearDemoSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(DEMO_MODE_KEY);
  document.cookie = `${DEMO_MODE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function isDemoSessionEnabled() {
  if (!isBrowser()) {
    return false;
  }

  const fromStorage = window.localStorage.getItem(DEMO_MODE_KEY);
  if (fromStorage === "1") {
    return true;
  }

  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith(`${DEMO_MODE_KEY}=1`));
}

export function persistOnboardingStatus(completed: boolean) {
  if (!isBrowser()) {
    return;
  }

  const value = completed ? "1" : "0";
  window.localStorage.setItem(ONBOARDING_KEY, value);
  document.cookie = `${ONBOARDING_KEY}=${value}; path=/; max-age=2592000; samesite=lax`;
}

export function isOnboardingCompleted() {
  if (!isBrowser()) {
    return false;
  }

  const fromStorage = window.localStorage.getItem(ONBOARDING_KEY);
  if (fromStorage === "1") {
    return true;
  }

  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith(`${ONBOARDING_KEY}=1`));
}
