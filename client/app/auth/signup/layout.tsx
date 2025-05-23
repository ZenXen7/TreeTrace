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
  title: "Signup",
  description: "Signup to your account",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`min-h-screen bg-black antialiased ${outfit.variable} ${outfit.className}`}>{children}</div>;
}
