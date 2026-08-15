import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radario — Job Intelligence",
  description: "Find early, low-competition software opportunities.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
