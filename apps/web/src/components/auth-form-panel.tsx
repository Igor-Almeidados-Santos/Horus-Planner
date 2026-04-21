"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ApiError,
  fetchCurrentUser,
  loginWithGoogleCredential,
  loginWithPassword,
  registerAccount,
  type LoginInput,
  type LoginResponse,
  type RegisterInput,
} from "../services/horus-api";
import {
  clearDemoSession,
  persistAuthSession,
  persistDemoSession,
  persistOnboardingStatus,
  storeAuthUser,
} from "../lib/auth-session";
import { GoogleLoginButton } from "./google-login-button";

type AuthMode = "login" | "register";

type FormState = {
  name: string;
  email: string;
  password: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  password: "",
};

export function AuthFormPanel({ mode, nextRoute = "/" }: { mode: AuthMode; nextRoute?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function finalizeAuthenticatedSession(session: LoginResponse) {
    clearDemoSession();
    persistAuthSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarLabel: session.user.avatarLabel,
      },
    });

    try {
      const currentUser = await fetchCurrentUser();
      const onboardingCompleted = currentUser.profile?.preferences?.onboardingCompleted === true;
      storeAuthUser({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        avatarLabel: currentUser.avatarLabel,
      });
      persistOnboardingStatus(onboardingCompleted);
      router.push(onboardingCompleted ? nextRoute : `/onboarding?next=${encodeURIComponent(nextRoute)}`);
    } catch {
      storeAuthUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarLabel: session.user.avatarLabel,
      });
      persistOnboardingStatus(false);
      router.push("/onboarding");
      router.refresh();
      return;
    }
    router.refresh();
  }

  function buildFriendlyAuthError(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      if (error.message.includes("EMAIL_EXISTS") || error.message.includes("email-already-exists")) {
        return "Este e-mail ja esta cadastrado. Tente entrar ou usar outro e-mail.";
      }

      if (error.message.includes("INVALID_LOGIN_CREDENTIALS") || error.message.includes("INVALID_PASSWORD")) {
        return "E-mail ou senha invalidos.";
      }

      if (error.message.includes("INVALID_EMAIL")) {
        return "O e-mail informado nao e valido.";
      }

      if (error.message.includes("OPERATION_NOT_ALLOWED")) {
        return "Esse metodo de login ainda nao esta ativado no Firebase.";
      }

      if (error.message.includes("INVALID_IDP_RESPONSE") || error.message.includes("CREDENTIAL_MISMATCH")) {
        return "O login com Google falhou. Confirme se o provedor Google esta ativado no Firebase Auth.";
      }

      if (error.message.includes("FIREBASE_WEB_API_KEY")) {
        return "A Web API Key do Firebase nao foi configurada corretamente no backend.";
      }

      return error.message;
    }

    return fallback;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      let session: LoginResponse | null = null;

      if (isRegister) {
        const registerPayload: RegisterInput = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        };

        const registerResult = await registerAccount(registerPayload);
        if ("accessToken" in registerResult) {
          session = registerResult;
        }
      }

      if (!session) {
        const loginPayload: LoginInput = {
          email: form.email.trim(),
          password: form.password,
        };

        session = await loginWithPassword(loginPayload);
      }

      await finalizeAuthenticatedSession(session);
    } catch (error) {
      setError(
        buildFriendlyAuthError(
          error,
          isRegister
            ? "Nao foi possivel criar sua conta agora. Verifique os dados e tente novamente."
            : "Nao foi possivel entrar agora. Verifique e-mail e senha.",
        ),
      );
      setIsBusy(false);
      return;
    }
  }

  async function handleGoogleLogin(credential: string) {
    setIsBusy(true);
    setError(null);

    try {
      const session = await loginWithGoogleCredential(credential);
      await finalizeAuthenticatedSession(session);
    } catch (error) {
      setError(buildFriendlyAuthError(error, "Nao foi possivel entrar com Google agora."));
      setIsBusy(false);
    }
  }

  function handleEnterDemo() {
    clearDemoSession();
    persistDemoSession();
    router.push(nextRoute);
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-eyebrow">Horus Planner</div>
        <h1>{isRegister ? "Criar conta" : "Entrar"}</h1>
        <p>
          {isRegister
            ? "Configure sua base inicial para planos, execucao e revisao."
            : "Continue para acessar sua rotina assistida por IA."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Nome
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
          ) : null}

          <label>
            E-mail
            <input
              type="email"
              placeholder="voce@exemplo.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={isBusy}>
            {isBusy
              ? isRegister
                ? "Criando..."
                : "Entrando..."
              : isRegister
                ? "Criar conta"
                : "Entrar"}
          </button>
        </form>

        {error ? <div className="auth-feedback error">{error}</div> : null}

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <GoogleLoginButton
          onCredential={handleGoogleLogin}
          text={isRegister ? "signup_with" : "signin_with"}
        />

        <div className="auth-helper-copy">
          <button type="button" className="auth-demo-button" onClick={handleEnterDemo}>
            Entrar no modo demonstracao
          </button>
          {isRegister ? (
            <Link href="/login">Ja tem conta? Entrar</Link>
          ) : (
            <Link href="/register">Nao tem conta? Criar conta</Link>
          )}
        </div>
      </section>
    </main>
  );
}
