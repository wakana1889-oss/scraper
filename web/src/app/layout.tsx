import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "リラックマのガチャ設置場所まとめ",
  verification: {
  google: "oKdEBQpwzWGBfBdZ48Rby5jnD0Mf5hKFadmSksxIkQo",
},
  description:
    "リラックマ・コリラックマ・キイロイトリ・チャイロイコグマのガチャガチャ設置場所や目撃情報を探せるマップサービスです。",
  openGraph: {
    title: "リラックマのガチャ設置場所まとめ",
    description:
      "リラックマのガチャガチャ設置場所・候補店舗・目撃情報をまとめています。",
    images: [
      {
        url: "/rilakkuma-hero.png",
        width: 1200,
        height: 630,
        alt: "リラックマのガチャ設置場所まとめ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "リラックマのガチャ設置場所まとめ",
    description:
      "リラックマのガチャガチャ設置場所・候補店舗・目撃情報を探せるマップサービスです。",
    images: ["/rilakkuma-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html
  lang="ja"
  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>
  <head>
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5182877630731375"
      crossOrigin="anonymous"
    />
  </head>

  <body className="min-h-full flex flex-col">
    {children}
  </body>
</html>
  );
}
