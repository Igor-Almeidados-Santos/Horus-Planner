"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number | string;
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({
  onCredential,
  text = "continue_with",
}: {
  onCredential: (credential: string) => void | Promise<void>;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google || !clientId) {
      return;
    }

    try {
      setScriptError(null);
      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          Promise.resolve(onCredential(credential)).catch((error) => {
            console.error("Google credential handler failed", error);
          });
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text,
        width: 320,
        logo_alignment: "left",
      });
    } catch (error) {
      console.error("Google Identity Services initialization failed", error);
      setScriptError("Nao foi possivel inicializar o login com Google neste navegador.");
    }
  }, [clientId, onCredential, scriptReady, text]);

  if (!clientId) {
    return (
      <div className="auth-inline-note">
        Configure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` para habilitar o login com Google.
      </div>
    );
  }

  if (scriptError) {
    return <div className="auth-inline-note">{scriptError}</div>;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptError(null);
          setScriptReady(true);
        }}
        onError={() => {
          setScriptReady(false);
          setScriptError("Nao foi possivel carregar o script do Google. Verifique a conexao e tente novamente.");
        }}
      />
      <div className="google-login-wrap">
        <div ref={containerRef} />
      </div>
    </>
  );
}
