import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { UsernameDialog } from "@/components/username-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GAIS QA Lounge",
  description: "GAISのセミナー動画にAIで質問しよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <UsernameDialog />
      </body>
    </html>
  );
}
