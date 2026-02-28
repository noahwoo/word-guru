import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Word Guru – Learn Words Through Fairy Tales",
  description: "An interactive app that helps children learn English vocabulary by generating engaging fairy tales with their learning words.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
