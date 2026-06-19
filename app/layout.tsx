import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizMail Studio",
  description: "초안을 전문적인 비즈니스 메일로 바꿔보세요.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
