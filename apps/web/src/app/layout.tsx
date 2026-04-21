import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horus Planner",
  description: "Student OS inspirado em workspace editorial escuro para rotina assistida por IA.",
  icons: {
    icon: "/brand/horus-mark.svg",
    shortcut: "/brand/horus-mark.svg",
    apple: "/brand/horus-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
