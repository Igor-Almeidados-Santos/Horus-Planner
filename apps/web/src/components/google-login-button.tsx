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
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google || !clientId) {
      return;
    }

    containerRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        onCredential(credential);
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
  }, [clientId, onCredential, scriptReady, text]);

  if (!clientId) {
    return (
      <div className="auth-inline-note">
        Configure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` para habilitar o login com Google.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="google-login-wrap">
        <div ref={containerRef} />
      </div>
    </>
  );
}
