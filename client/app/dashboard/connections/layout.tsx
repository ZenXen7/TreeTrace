import type { Metadata } from "next";
import "../../globals.css";

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`min-h-screen bg-black antialiased ${outfit.variable} ${outfit.className}`}>{children}</div>;
}
